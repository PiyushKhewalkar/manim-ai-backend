import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema({
   name : {
    type : String,
    },
    description : {
        type : String
    },
    chatHistory : [{
        user : {
            type : String
         },
        assistant : {
            type : String
        },
        code : {
            type : String
        },
        filePath : {
            type: String
        }
    }]
},
{
    timestamps : true
}
)

const Scene = mongoose.model("Scene", sceneSchema)

export default Scene