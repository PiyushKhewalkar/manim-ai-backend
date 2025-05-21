import { Router } from "express";

import { getPlan, getPlans, createPlan, iteratePlan, planToVideo} from "../controllers/plan.controller.js";

// get plans
// get plan
// create plan  - ai
// iterate plan - ai
// delete plan

const planRouter = Router()

planRouter.get("/", getPlans) // get all plans

planRouter.get("/:id", getPlan) // get one plan

planRouter.post("/create", createPlan) // create a plan

planRouter.post("/:id/iterate", iteratePlan) // iterate a plan

planRouter.post("/:id/convert", planToVideo) //plan to scenes to video

// planRouter.delete("/:id") // delete a plan

export default planRouter