import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import uploadToS3 from "./s3.js"; // your existing S3 uploader

const execPromise = promisify(exec);

export const combineScenes = async (sceneArray) => {
  try {
    if (!sceneArray || sceneArray.length === 0) {
      throw new Error("No scenes provided for combining.");
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "combine-scenes-"));
    const localScenePaths = [];

    // Step 1: Download each scene to temp files
    for (let i = 0; i < sceneArray.length; i++) {
      const sceneUrl = sceneArray[i];
      const localPath = path.join(tempDir, `scene_${i}.mp4`);
      const response = await axios.get(sceneUrl, { responseType: "stream" });

      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      localScenePaths.push(localPath);
    }

    // Step 2: Create FFmpeg input list file
    const listPath = path.join(tempDir, "fileList.txt");
    const listContent = localScenePaths.map(p => `file '${p}'`).join("\n");
    fs.writeFileSync(listPath, listContent);

    // Step 3: Run FFmpeg to concatenate
    const outputPath = path.join(tempDir, "final_output.mp4");
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    await execPromise(ffmpegCmd);

    // Step 4: Upload to S3
    const finalS3Key = `videos/combined_${Date.now()}.mp4`;
    const finalS3Url = await uploadToS3(outputPath, finalS3Key);

    // Step 5: Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });

    return finalS3Url;
  } catch (error) {
    console.error("Error combining scenes:", error);
    throw new Error("Failed to combine scenes: " + error.message);
  }
};


export const extractScenes = (video) => {
  if (!video || !Array.isArray(video.scenes)) {
    throw new Error("Invalid video object or scenes not found.");
  }

  // Sort scenes by order and extract fileUrl
  const sceneUrls = video.scenes
    .sort((a, b) => a.order - b.order)
    .map(scene => scene.fileUrl);

  return sceneUrls;
};
