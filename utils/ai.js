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
});

const generateSceneCode = async(userPrompt) => {
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

export default generateSceneCode