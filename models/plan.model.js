import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
  },
  concept: {
    type: String,
    required: true,
  },
});

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  userPrompt : {
    type: String,
    required: true
  },
  scenes: [sceneSchema],
}, {
  timestamps: true
});

const Plan = mongoose.model("Plan", planSchema)

export default Plan