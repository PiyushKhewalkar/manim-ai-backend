import express from "express"

// routes
import sceneRouter from "./routes/scenes.routes.js";


// database
import connectToDatabase from './database/mongodb.js';

// environment variables
import { PORT } from './config/env.js';

const app = express();

app.use(express.json());

app.use("/scene",sceneRouter)

app.get("/", (req, res) => {
  res.json({"message" : "Home"})
})


app.listen(PORT, async() => {
  console.log(`Server running on port ${PORT}`);
  await connectToDatabase()
});
