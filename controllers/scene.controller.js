import Scene from "../models/scene.model.js";

import axios from "axios";

import path from 'path';
import fs from 'fs';


//utils
import generateSceneAnimation from "../utils/manim.js";
import {generateSceneCode, regenerateSceneCode} from "../utils/ai.js";
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

export const generateScene = async (req, res) => {
    try {
        const { userPrompt } = req.body;

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ message: "Invalid or missing userPrompt" });
        }

        // 🎨 Get the code from AI
        const sceneConfig = await generateSceneCode(userPrompt);
        const pythonCode = sceneConfig.code.replace(/\\n/g, '\n');

        // 🎬 Send code to FastAPI for rendering + uploading
        const response = await axios.post("http://127.0.0.1:8000/render-scene/", {
            code: pythonCode,
        });

        console.log("response", response)

        const s3Url = response.data.s3_url;
        console.log("✅ Video uploaded to S3:", s3Url);

        // 💾 Save to DB (if needed)
        const newScene = await new Scene({
            name: sceneConfig.name,
            description: sceneConfig.description,
        });

        newScene.chatHistory.push({
            user: userPrompt,
            assistant: sceneConfig.assistantMessage,
            code: sceneConfig.code,
            filePath: s3Url
        });

        await newScene.save();

        // 🚀 Respond to frontend
        return res.status(201).json({
            message: "Scene created successfully",
            fileUrl: s3Url,
            newScene, // Uncomment when DB is active
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            details: error.message,
        });
    }
}


export const regenerateScene = async(req, res) => {
    try {

        const { id } = req.params

        const { userPrompt } = req.body

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ message: "Invalid or missing userPrompt" });
        }

        const foundScene = await Scene.findById(id)

        if (!foundScene) return res.status(404).json({message : "scene not found"})

        const regeneratedSceneConfig = await regenerateSceneCode(userPrompt, foundScene.chatHistory)

        const pythonCode = regeneratedSceneConfig.code.replace(/\\n/g, '\n');

         // 🎬 Generate video using manim
         // 🎬 Send code to FastAPI for rendering + uploading
        const response = await axios.post("http://127.0.0.1:8000/render-scene/", {
            code: pythonCode,
        });

        console.log("response", response)

        const s3Url = response.data.s3_url;
        console.log("✅ Video uploaded to S3:", s3Url);

        // save into database

         foundScene.chatHistory.push({
           user : userPrompt,
           assistant : regeneratedSceneConfig.assistantMessage,
           code : regeneratedSceneConfig.code,
           filePath : s3Url
         })

         await foundScene.save()

         return res.status(200).json({message : "scene regenerated succesfully", foundScene, fileUrl : s3Url})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}