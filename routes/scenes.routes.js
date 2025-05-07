import { Router } from "express";
import { getScenes, getScene, generateScene, deleteScene } from "../controllers/scene.controller.js";

const sceneRouter = Router()

sceneRouter.get("/", getScenes) // get all scenes

sceneRouter.get("/:id", getScene) // get scene

sceneRouter.post("/generate", generateScene) // Generate Scene

sceneRouter.delete("/:id", deleteScene) // delete scene

export default sceneRouter