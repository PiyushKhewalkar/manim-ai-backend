import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  name: {
    type: String,
    required : true
  },
  scenes: [
    {
      order: {
        type: Number,
        required : true
      },
      sceneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Scene",
        required : true
      },
      fileUrl : {
        type : String,
        required : true
      }
    },
  ],
  videoUrl : {
    type : String // will only be created when video clicks "Export"
  }
},
{timestamps : true}
);

const Video = mongoose.model("Video", videoSchema)

export default Video