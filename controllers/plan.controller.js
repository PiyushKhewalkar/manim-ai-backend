import Plan from "../models/plan.model.js";
import Video from "../models/video.model.js";

export const getPlans = async(req, res) => {
    try {

        const plans = await Plan.find()

        return res.status(200).json({plans})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const getPlan = async(req, res) => {
    try {

        const {id} = req.params

        const plan = await Plan.findById(id)

        if (!plan) return res.status(404).json({message: "Plan not found"})

        return res.status(200).json({plan})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const createPlan = async(req, res) => {
    try {

        const {name, videoId, userPrompt} = req.body

        const video = await Video.findById(videoId)

        if(!video) return res.status(404).json({message: "Invalid video ID"})

        const generatedPlan = await generatePlan(userPrompt)

        const newPlan = new Plan({
            name: video.name,
            videoId: video._id,
            scenes: generatedPlan
        })

        return res.status(201).json({message: "Plan created succesfully", newPlan})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const iteratePlan = async (req, res) => {

  try {
    const { id } = req.params;
    const { userPrompt } = req.body;

    const existingPlan = await Plan.findById(id);
    if (!existingPlan) return res.status(404).json({ message: "Plan not found" });

    const regeneratedPlan = await regeneratePlan(userPrompt, existingPlan);

    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { scenes: regeneratedPlan },
      { new: true }
    );

    await updatedPlan.save()

    return res.status(200).json({ message: "Plan updated", data: updatedPlan });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error", details: error.message });
  }
};

export const planToVideo = async(req, res) => {
    try {

        const {id} = req.params

        const {videoId} = req.body

        const plan = await Plan.findById(id)

        plan.scenes.forEach((scene) => {
            // generate code

            // generate Manim animation

            // upload to s3

            // save to Scene db
        })

        

        
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", details: error.message });
    }
}