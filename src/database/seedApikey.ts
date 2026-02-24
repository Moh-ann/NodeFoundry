import mongoose from "mongoose"
import crypto from "crypto"
import { ApiKeyModel, Permission } from "../models/ApiKeyModel.js"
import { dbURI } from "./index.js"

async function seedApiKey() {
  try {
    await mongoose.connect(dbURI)

    console.log("Connected to MongoDB")

    const generatedApiKey = crypto.randomBytes(32).toString("hex")

    const apiKey = new ApiKeyModel({
      key: generatedApiKey,
      version: 1,
      permissions: [Permission.GENERAL],
      status: true,
    })

    await apiKey.save()
    console.log("Sample API key seeded successfully:", apiKey)
  } catch (error) {
    console.error("Error seeding API key:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  }
}

seedApiKey()