import { Router } from "express";
import { getVideos, getVideo, launchVideo,  produceVideo, deleteVideo} from "../controllers/video.controller.js";

const videoRouter = Router()

videoRouter.get("/", getVideos) // get all videos

videoRouter.get("/:id", getVideo) // get video

videoRouter.post("/launch", launchVideo) // launch video

videoRouter.get("/produce/:id", produceVideo) // produce video

videoRouter.delete("/:id", deleteVideo) // delete video

export default videoRouter