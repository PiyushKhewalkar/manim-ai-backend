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
