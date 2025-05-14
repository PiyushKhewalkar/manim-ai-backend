import Scene from "../models/scene.model.js";
import Video from "../models/video.model.js";

import path from 'path';
import fs from 'fs';


//utils
import generateSceneAnimation from "../utils/manim.js";
import {generateSceneCode, regenerateSceneCode} from "../utils/ai.js";
import uploadToS3 from "../utils/s3.js";

export const getScenes = async(req, res) => {
    try {

        const {videoId} = req.params

        const video = await Video.findById(videoId)

        const scenes = video.scenes

        return res.status(200).json({scenes})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const getScene = async(req, res) => {
    try {

        const {id} = req.params

        const scene = await Scene.findById(id)

        if (!scene) return res.status(404).json({message: "Scene not found"})

        return res.status(200).json({scene})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}


export const deleteScene = async(req, res) => {
    try {

        const {id} = req.params

        const scenes = await Scene.findByIdAndDelete(id)

        return res.status(200).json({message: "Scene deleted succesfully", scenes})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const generateScene = async(req, res) => {
    try {

        // Get the user prompt

        const {userPrompt} = req.body
        const {videoId} = req.params

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ message: "Invalid or missing userPrompt" });
        }

        const video = await Video.findById(videoId)

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
          }

        // Send the prompt to AI and get the Code

        const sceneConfig = await generateSceneCode(userPrompt)

        if (!sceneConfig || !sceneConfig.code || !sceneConfig.name) {
            return res.status(500).json({ message: "AI scene generation failed or incomplete response" });
          }          

        const pythonCode = sceneConfig.code.replace(/\\n/g, '\n');

        console.log(pythonCode);

        // 🎬 Generate video using manim
        const localVideoPath = await generateSceneAnimation(pythonCode);
        console.log("🎥 Local video path:", localVideoPath);

        // 🗂 Extract filename for S3
        const fileName = path.basename(localVideoPath); // e.g., Scene_12345.mp4
        const s3Key = `videos/${Date.now()}_${fileName}.mp4`;
        const s3Url = await uploadToS3(localVideoPath, s3Key);
        console.log("Uploaded to S3:", s3Url);


        // 🗑 Optionally delete local file
        fs.unlinkSync(localVideoPath);

         // save into database

         const newScene = new Scene({
            name : sceneConfig.name,
            description : sceneConfig.description,
        })

        const nextOrder = video.scenes.length + 1;

        newScene.chatHistory.push({
            order : nextOrder,
            user : userPrompt,
            assistant : sceneConfig.assistantMessage,
            code : sceneConfig.code,
            filePath : s3Url
        })

        await newScene.save(); 

        const scene = {
            order: nextOrder,
            sceneId: newScene._id,
            fileUrl: newScene.chatHistory.at(-1).filePath
        };

        video.scenes.push(scene)

        await video.save();

        // return the path

        return res.status(201).json({message : "Scene created succesfully", newScene, fileUrl: s3Url})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const regenerateScene = async (req, res) => {
    try {
        const { id, videoId } = req.params;
        const { userPrompt } = req.body;

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ message: "Invalid or missing userPrompt" });
        }

        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ message: "Video not found" });

        const foundScene = await Scene.findById(id);
        if (!foundScene) return res.status(404).json({ message: "Scene not found" });

        const order = foundScene.order;

        const regeneratedSceneConfig = await regenerateSceneCode(userPrompt, foundScene.chatHistory);
        const pythonCode = regeneratedSceneConfig.code.replace(/\\n/g, '\n');

        let localVideoPath;
        let s3Url; // ✅ Declare it here so it's accessible later

        try {
            localVideoPath = await generateSceneAnimation(pythonCode);
            console.log("🎥 Local video path:", localVideoPath);

            const fileName = path.basename(localVideoPath);
            const s3Key = `videos/${Date.now()}_${fileName}.mp4`;
            s3Url = await uploadToS3(localVideoPath, s3Key); // ✅ Assign value here
            console.log("Uploaded to S3:", s3Url);
        } finally {
            if (localVideoPath) fs.unlinkSync(localVideoPath);
        }

        // Save in scene
        foundScene.chatHistory.push({
            order: order,
            user: userPrompt,
            assistant: regeneratedSceneConfig.assistantMessage,
            code: regeneratedSceneConfig.code,
            filePath: s3Url
        });

        const sceneToUpdate = video.scenes.find(scene => scene.sceneId.toString() === foundScene._id.toString());
        if (sceneToUpdate) {
            sceneToUpdate.fileUrl = s3Url; // update the field
            video.markModified('scenes');  // ✅ force mongoose to track this update
            console.log("Scene updated in the video object");
        }

        await foundScene.save();
        await video.save();

        return res.status(200).json({
            message: "Scene regenerated successfully",
            foundScene,
            fileUrl: s3Url // ✅ Now accessible
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            details: error.message
        });
    }
};

