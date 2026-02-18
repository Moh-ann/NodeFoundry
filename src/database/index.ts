import mongoose from "mongoose"
import { db } from "../config.js"

const dbURI = `mongodb://${db.host}:${db.port}/${db.name}`

mongoose
  .connect(dbURI)
  .then(() => "MongoDB Connected")
  .catch(err => console.log(err))
