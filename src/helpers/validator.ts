import type { NextFunction, Request, Response } from "express"
import { type ZodSchema, ZodError } from "zod"
import { BadRequestError } from "../core/CustomError.js"

export enum ValidationSource {
    BODY = "body",
    QUERY = "query",
    HEADER = "headers",
    PARAM = "params",
}

const validateRequest = (schema: ZodSchema, source: ValidationSource = ValidationSource.BODY) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = schema.parse(req[source])
            Object.assign(req[source], data)
            next()
        } catch (err) {
            if(err instanceof ZodError){
                const message = err.issues.map(e => e.message).join(", ")
                return next(new BadRequestError(message))
            }
            next(err)
        }
    }
}

export default validateRequest