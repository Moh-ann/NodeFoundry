import Logger from "./core/Logger.js"
import { port } from "./config.js"
import app from "./app.js"
import dotenv from "dotenv"
import express from 'express'

dotenv.config()

app.use(express.json())

app.listen(port, () => {
  Logger.info(`server running on port : ${port}`)
  console.log(`server running on port : ${port}`)
})
.on("error", e => Logger.error(e))