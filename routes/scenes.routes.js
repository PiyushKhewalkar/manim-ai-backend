import { Router } from "express";
import { getScenes, getScene, generateScene, regenerateScene, deleteScene } from "../controllers/scene.controller.js";

const sceneRouter = Router()

sceneRouter.get("/:videoId", getScenes) // get all scenes of a video

sceneRouter.get("/:id", getScene) // get a scene

sceneRouter.post("/generate/:videoId", generateScene) // Generate Scene

sceneRouter.post("/regenerate/:id/:videoId", regenerateScene) // regenerate Scene

sceneRouter.delete("/:id", deleteScene) // delete scene

export default sceneRouter