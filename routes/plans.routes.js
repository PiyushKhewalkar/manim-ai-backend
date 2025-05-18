import { Router } from "express";

// get plans
// get plan
// create plan  - ai
// iterate plan - ai
// delete plan

const planRouter = Router()

planRouter.get("/", ) // get all plans

planRouter.get("/:id", ) // get one plan

planRouter.post("/create", ) // create a plan

planRouter.post("/:id/iterate", ) // iterate a plan

planRouter.post("/convert", ) //plan to scenes to video

planRouter.delete("/:id") // delete a plan