import Scene from "../models/scene.model.js";

import path from 'path';
import fs from 'fs';


//utils
import generateSceneAnimation from "../utils/manim.js";
import generateSceneCode from "../utils/ai.js";
import uploadToS3 from "../utils/s3.js";

export const getScenes = async(req, res) => {
    try {

        const scenes = await Scene.find()

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

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ message: "Invalid or missing userPrompt" });
        }

        // Send the prompt to AI and get the Code

        const sceneConfig = await generateSceneCode(userPrompt)

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

         const newScene = await new Scene({
            name : sceneConfig.name,
            description : sceneConfig.description,
        })

        newScene.chatHistory.push({
            user : userPrompt,
            assistant : sceneConfig.message,
            code : sceneConfig.code,
            filePath : s3Url
        })

        await newScene.save(); // <-- This is missing

        // return the path

        return res.status(201).json({message : "Scene created succesfully", newScene, fileUrl: s3Url})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}