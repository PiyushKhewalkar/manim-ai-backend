import AWS from "aws-sdk"
import fs from "fs"
import path from "path";

// environment variables
import { AWS_SECRET_ACCESS_KEY, AWS_ACCESS_KEY_ID } from "../config/env.js";

// Setup AWS S3
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,  // store in .env
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "eu-north-1", // your bucket region
});

const uploadToS3 = async(localFilePath, s3Key) => {
  const fileContent = fs.readFileSync(localFilePath);

  const params = {
    Bucket: "manimdrafts",
    Key: s3Key, // e.g., 'videos/output.mp4'
    Body: fileContent,
    ContentType: "video/mp4",
  };

  const data = await s3.upload(params).promise();
  return data.Location; // This is the public URL
}

export default uploadToS3