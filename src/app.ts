import express, { type NextFunction, type Request, type Response } from "express"
import cors from "cors"
import "./database/index.js"
import cookieParser from "cookie-parser"
import userRoutes from "./routes/userRoutes.js"
import { corsUrl, environment, port } from "./config.js"
import todoRoutes from "./routes/todoRoutes.js"
import { ApiError, ErrorType } from "./core/ApiError.js"
import Logger from "./core/Logger.js"
import { InternalError } from "./core/CustomError.js"

const app = express()

app.use(cors({ origin: corsUrl, optionsSuccessStatus: 200 }))

app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/users", userRoutes)
app.use("/api/todo", todoRoutes)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

  if (err instanceof ApiError) {

    Logger.error(
      `${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    )
    Logger.error(err.stack)

    if (environment === "development") {
      return res.status(err.statusCode).json({
        type: err.type,
        message: err.message
        // stack intentionally not sent to client
      })
    }

    return ApiError.handle(err, res)
  }

  Logger.error(err.stack)

  if (environment === "development") {
    return res.status(500).json({
      type: "Internal",
      message: err.message
    })
  }

  return ApiError.handle(new InternalError(), res)
})

export default app