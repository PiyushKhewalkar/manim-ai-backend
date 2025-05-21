import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { OPENAI_API_KEY } from "../config/env.js";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

const Animation = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
  assistantMessage : z.string()
});

const ReAnimation = z.object({
  code : z.string(),
  assistantMessage : z.string()
})

const PlanZ = z.object({
  scenes : z.array(
    z.object({
      order: z.number(),
      concept: z.string(),
    })
  )
})

const SceneValidator = z.object({
  status: z.boolean(),
  message: z.string()
})

const improvedSceneCode = z.object({
  code: z.string()
})



export const generateSceneCode = async(userPrompt) => {
    const response = await openai.responses.parse({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: `Your task is to come up with:
1. A creative, relevant animation name (in PascalCase)
2. A 1-2 sentence description of what the animation does
3. Manim Python code that implements the animation

Instructions:
- Generate an **original** animation name in PascalCase (e.g., \`FibonacciSpiral\`)
- Write a **brief description** of what the animation does
- Write only the Manim Python code as a raw string with escaped newlines (\\\\n) and 4-space indentation
- The code must start with: \`from manim import *\`
- Define a class with the animation name that inherits from \`Scene\`
- Inside the \`construct()\` method, write animation logic based on the description
- **Keep it clean, minimal, and easy to follow**
- **Avoid overdesign** — no fancy colors, no dramatic transitions, no flashy effects
- Use **basic elements** (like Text, Line, Circle, Square, or MathTex)
- Keep animations **very simple** (e.g., fade in/out, move, write)
- Do **not** include markdown formatting or explanations
- Wrap the final code output in double quotes ("...")
- Write your message in the "assistantMessage" key

Output Format:
Animation Name: PascalCaseName  
Description: One or two line summary  
Code: "from manim import *\\\\n\\\\nclass PascalCaseName(Scene):\\\\n    def construct(self):\\\\n        self.play(...)"`
},
          {
            role: "user",
            content: userPrompt,
          },
        ],
        text: {
          format: zodTextFormat(Animation, "manimAnimation"),
        },
      });

      const scene = response.output_parsed;

      return scene
}

export const regenerateSceneCode = async(userPrompt, chatHistory) => {

  // Helper function to get last n messages
  const getLastMessages = (count = 3) => {
    if (!chatHistory || !Array.isArray(chatHistory)) {
      console.warn("chatHistory is not valid");
      return "";
    }
    const lastMessages = chatHistory.slice(-count);
    return lastMessages.map(entry => `User: ${entry.user}\nAssistant: ${entry.assistant}\nCode: ${entry.code}`).join("\n\n");
  };

  // Generate system message
  const systemMessage = `
    You are regenerating Manim animation code based on updated instructions from the user.
    
    Follow these rules:
    1. Look at the recent chat history (if any) to understand what was already created.
    2. Do **not repeat** the same code or animation idea unless the user asks for a tweak.
    3. Incorporate the user's new prompt to update or enhance the animation.
    4. Keep it **clean, minimal, and readable**.
    5. Use only **basic elements** (Text, Line, Circle, Square, MathTex).
    6. Use only **simple animations** (FadeIn, FadeOut, Write, MoveTo, etc.).
    7. **Do not include placeholders** like \`self.play(...)\` — write full, working animation logic.
    8. Code must start with \`from manim import *\`
    9. Define a class with a **clear PascalCase name** that inherits from \`Scene\`
    10. Inside the \`construct()\` method, include working Manim code
    11. Escape newlines using \\\\n and use 4-space indentation.
    12. Do **not** include markdown formatting, code fencing, or explanations.
    13. Write your message in the "assistantMessage" key

    Last animations created:
    ${getLastMessages(3)}

    User's new prompt:
    ${userPrompt}

    Return only:
    - \`code\`: the final Manim Python code string
    - \`assistantMessage\`: a short note explaining how this version is different from the previous one
  `;

  // Get response from AI
  const response = await openai.responses.parse({
    model: "gpt-4o-mini",
    input: [
      { 
        role: "system", 
        content: systemMessage
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    text: {
      format: zodTextFormat(ReAnimation, "regeneratedAnimation"),
    },
  });

  // Parse AI response
  const scene = response.output_parsed;

  return scene;
}

export const generatePlan = async(userPrompt) => {
  const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: `
You are an AI assistant that breaks down a topic into a sequence of visual animation scenes.

The animations will be built using **Manim**, so please keep its capabilities in mind — including text, shapes, camera movements, and animations like FadeIn, Write, GrowFromCenter, Transform, etc.

Your job is to return a JSON array of scenes, where each item contains:
- "order" (as a number)
- "concept" (a very specific, short instruction for what to draw and animate in that scene)

Focus on:
- What elements should be shown (heading, paragraph, label, shapes, icons)
- What animation should be used (e.g., Write, FadeIn, Transform)
- How to visually place them (top, center, left, etc.)
- Keeping it simple enough to animate using Manim's core features

Avoid vague terms like “this” or “that”. Be precise and direct in your wording.

Make it sound conversational and educational, like explaining a concept to a curious learner.

Here are a few examples of the **concept** values:

1. "Draw the heading 'Newton's First Law' at the top using Write animation. Below it, display a still apple resting on a table with a subtle GrowFromCenter effect."
2. "Show an arrow pointing to the right labeled 'Force'. Then draw a box that moves in the same direction to demonstrate motion. Use Transform animation for the box's movement."
3. "Introduce the word 'Inertia' in bold at the center of the screen. Fade it in slowly while a simple icon of a sleeping cat appears in the corner to symbolize stillness."

Now based on the following topic, break it into such scenes.

Topic: "${userPrompt}"

Only return the array.
`
},
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: zodTextFormat(PlanZ, "animationPlan"),
      },
    });

    const plan = response.output_parsed;
    
    console.log(plan)

    return plan
}

export const validateScene = async(userPrompt, code) => {
  const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: `You are an AI code reviewer that validates whether a piece of Manim animation code accurately implements the visual scene described in a user's prompt.

You will receive:
- A **userPrompt**: A natural language description of the animation scene the user wants.
- A **code**: Python code written using the Manim library.

Your task is to check if the code:
- Matches the described elements (text, shapes, labels, icons, etc.)
- Uses correct and relevant Manim animations (e.g., Write, FadeIn, Transform)
- Places elements as per the described positions (e.g., center, top-left, etc.)
- Is logically complete (i.e., doesn't miss key elements mentioned in the userPrompt)
- Does not contain unrelated or extra elements that weren’t asked for

Respond in this format:
{
  "status": true | false, // true if the code fulfills the userPrompt accurately
  "message": "Explain briefly why it’s correct or what’s missing/wrong."
}

code: ${code}

userPromp: ${userPrompt}

Keep your evaluation strict but constructive. Only return the JSON object.
`},
        {
          role: "user",
          content: userPrompt,
        },
      ],
      text: {
        format: zodTextFormat(SceneValidator, "sceneValidator"),
      },
    });

    const result = response.output_parsed;
    
    console.log(result)

    return result
}

export const improveSceneCode = async (existingCode, improvement, userPrompt) => {
  const response = await openai.responses.parse({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: `
You are an expert Manim code editor.

Your job is to improve existing Manim Python code based on:
- The original scene description (userPrompt)
- The improvement instruction (what's missing or should be changed)

You must:
- Only modify what's necessary to fulfill the improvement
- Make the code cleaner and logically correct
- Use appropriate Manim animations (e.g., Write, FadeIn, Transform)
- Ensure all visual elements mentioned in the userPrompt are implemented
- Avoid removing parts of the original code that are still valid

Return the improved Python code as a single string.

Respond ONLY with a valid JSON object:
{
  "code": "..." // improved and corrected Manim Python code
}
        `
      },
      {
        role: "user",
        content: `
Existing Code:
\`\`\`python
${existingCode}
\`\`\`

Improvement Suggestion:
"${improvement}"

Original Scene Description:
"${userPrompt}"
        `
      }
    ],
    text: {
      format: zodTextFormat(improvedSceneCode, "improvedSceneCode"),
    }
  });

  const result = response.output_parsed;

  console.log(result);

  return result;
}
