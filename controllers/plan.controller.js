import Plan from "../models/plan.model.js";
import Video from "../models/video.model.js";
import Scene from "../models/scene.model.js";

import {
  generatePlan,
  generateSceneCode,
  validateScene,
  improveSceneCode,
} from "../utils/ai.js";
import generateSceneAnimation from "../utils/manim.js";
import uploadToS3 from "../utils/s3.js";
import cleanCode from "../utils/cleanCode.js";

import path from "path";
import fs from "fs";

export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();

    return res.status(200).json({ plans });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};

export const getPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findById(id);

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    return res.status(200).json({ plan });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { videoId, userPrompt } = req.body;

    const video = await Video.findById(videoId);

    if (!video) return res.status(404).json({ message: "Invalid video ID" });

    const generatedPlan = await generatePlan(userPrompt);

    const newPlan = new Plan({
      name: video.name,
      videoId: video._id,
      userPrompt: userPrompt,
      scenes: generatedPlan.scenes,
    });

    await newPlan.save();

    return res
      .status(201)
      .json({ message: "Plan created succesfully", newPlan });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};

export const iteratePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { userPrompt } = req.body;

    const existingPlan = await Plan.findById(id);
    if (!existingPlan)
      return res.status(404).json({ message: "Plan not found" });

    const regeneratedPlan = await regeneratePlan(userPrompt, existingPlan);

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { scenes: regeneratedPlan },
      { new: true }
    );

    await updatedPlan.save();

    return res.status(200).json({ message: "Plan updated", data: updatedPlan });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};

export const planToVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const results = [];

    for (const scene of plan.scenes) {
      const userPrompt = scene.concept;

      if (!userPrompt || typeof userPrompt !== "string") {
        continue; // skip invalid
      }

      const sceneConfig = await generateSceneCode(userPrompt);
      if (!sceneConfig || !sceneConfig.code || !sceneConfig.name) {
        continue; // skip failed
      }

      let pythonCode = sceneConfig.code.replace(/\\n/g, "\n");

      pythonCode = cleanCode(pythonCode);

      // add a scene validation step here

      const sceneValidator = await validateScene(userPrompt, pythonCode);

      let improvedSceneCode;

      if (!sceneValidator.status) {
        try {
          const existingCode = pythonCode;
          const improvement = sceneValidator.message;
          const response = await improveSceneCode(
            existingCode,
            improvement,
            userPrompt
          );
          improvedSceneCode = cleanCode(response.code);
        } catch (error) {
          console.error("Error improving scene code:", error);
          improvedSceneCode = pythonCode; // fallback to original
        }
      } else {
        improvedSceneCode = pythonCode;
      }

      // add a code (syntax) validation step here

      const localVideoPath = await generateSceneAnimation(pythonCode);

      const fileName = path.basename(localVideoPath);
      const s3Key = `videos/${Date.now()}_${fileName}.mp4`;
      const s3Url = await uploadToS3(localVideoPath, s3Key);

      fs.unlinkSync(localVideoPath);

      const newScene = new Scene({
        name: sceneConfig.name,
        description: sceneConfig.description,
      });

      const nextOrder = video.scenes.length + 1;

      newScene.chatHistory.push({
        order: nextOrder,
        user: userPrompt,
        assistant: sceneConfig.assistantMessage,
        code: improvedSceneCode,
        filePath: s3Url,
      });

      await newScene.save();

      const sceneMeta = {
        order: nextOrder,
        sceneId: newScene._id,
        fileUrl: newScene.chatHistory.at(-1).filePath,
      };

      video.scenes.push(sceneMeta);
      await video.save();

      results.push({ sceneId: newScene._id, fileUrl: s3Url });
    }

    return res.status(201).json({
      message: "All scenes generated and added to video successfully",
      scenes: results,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};
