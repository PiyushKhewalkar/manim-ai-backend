import { Router } from "express";
import { getScenes, getScene, generateScene, regenerateScene, deleteScene } from "../controllers/scene.controller.js";

const sceneRouter = Router()

sceneRouter.get("/", getScenes) // get all scenes

sceneRouter.get("/:id", getScene) // get scene

sceneRouter.post("/generate", generateScene) // Generate Scene

sceneRouter.put("/regenerate/:id", regenerateScene) // regenerate Scene

sceneRouter.delete("/:id", deleteScene) // delete scene

export default sceneRouter