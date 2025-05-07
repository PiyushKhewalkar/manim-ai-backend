import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSceneAnimation = (sceneCode) => {
  return new Promise((resolve, reject) => {
    try {
      if (!sceneCode) {
        console.log("❌ code is required");
        return reject("Code is required");
      }

      // ✅ Save file inside /scenes directory
      const fileName = `Scene_${Date.now()}.py`;
      const scenesDir = path.join(__dirname, "../scenes");
      const filePath = path.join(scenesDir, fileName);

      if (!fs.existsSync(scenesDir)) fs.mkdirSync(scenesDir, { recursive: true });
      fs.writeFileSync(filePath, sceneCode);
      console.log(`📄 Scene saved to: ${filePath}`);

      // ✅ Extract class name
      const sceneNameMatch = sceneCode.match(/class\s+(\w+)\(Scene\)/);
      if (!sceneNameMatch) return reject("❌ Scene class not found");

      const sceneName = sceneNameMatch[1];
      console.log(`🎬 Rendering scene: ${sceneName}`);

      // ✅ Define where to save the output video
      const outputDir = path.join(__dirname, "../media/videos");

      const command = `manim render -pql "${filePath}" ${sceneName}`;

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Error:", err);
          console.error("📛 Stderr:", stderr);
          return reject(stderr);
        }

        console.log("✅ Manim stdout:", stdout);

        // Construct expected video path
        const baseName = path.basename(fileName, ".py");
        const outputPath = path.join(outputDir, baseName, "480p15", `${sceneName}.mp4`);

        if (fs.existsSync(outputPath)) {
          console.log(`🎉 Video rendered at: ${outputPath}`);
          resolve(outputPath);
          return {outputPath : outputPath}
        } else {
          reject("❌ Video not found after rendering");
        }
      });
    } catch (err) {
      reject("💥 Server error: " + err.message);
    }
  });
};

export default generateSceneAnimation;
