import Video from "../models/video.model.js"

//utils
import { combineScenes, extractScenes } from "../utils/videoTools.js"

export const getVideos = async(req, res) => {
    try {

        const videos = await Video.find()

        return res.status(200).json({videos})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const getVideo = async(req, res) => {
    try {

        const {id} = req.params

        const video = await Video.findById(id)

        if (!video) return res.status(404).json({message: "Video not found"})

        return res.status(200).json({video})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const deleteVideo = async(req, res) => {
    try {

        const {id} = req.params

        const video = await Video.findByIdAndDelete(id)

        return res.status(200).json({message: "Video deleted succesfully", video})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const launchVideo = async(req, res) => {
    try {

        const {name} = req.body

        if (!name) return res.status(500).json({message : "name is required"})

        const newVideo = new Video({
            name : name
        })

        return res.status(201).json({message : "Video launched succesfully", newVideo})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}

export const produceVideo = async(req, res) => {
    try {

        const {id} = req.params

        const video = await Video.findById(id)

        if (!video) return res.status(404).json({message : "Video not found"})

        const sceneArray = await extractScenes(video) // extract all scene URLs from the video object

        const finalVideoPath = await combineScenes(sceneArray) // combine all the scenes and get the s3 URL

        video.videoUrl = finalVideoPath

        await video.save()

        return res.status(200).json({message: "Video Created Succesfully", video})
        
    } catch (error) {
        return res.status(500).json({message: "Internal server error", details: error.message})
    }
}