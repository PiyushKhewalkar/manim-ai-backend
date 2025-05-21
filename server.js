import express from "express"

// routes
import sceneRouter from "./routes/scenes.routes.js";
import videoRouter from "./routes/videos.routes.js";
import planRouter from "./routes/plans.routes.js";

// cors
import cors from "cors"


// database
import connectToDatabase from './database/mongodb.js';

// environment variables
import { PORT } from './config/env.js';

const app = express();

app.use(express.json());

app.use(cors())

app.use("/scene", sceneRouter)
app.use("/video", videoRouter)
app.use("/plan", planRouter)

app.get("/", (req, res) => {
  res.json({"message" : "Home"})
})


app.listen(PORT, async() => {
  console.log(`Server running on port ${PORT}`);
  await connectToDatabase()
});