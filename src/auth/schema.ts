import { z } from "zod"
import { Header } from "./utils.js"

export const ZodAuthBearer = z.string().refine(value => value.startsWith("Bearer"), {
  message: "Aushorization Header nist start with Bearer"
}).refine(value => value.split("")[1], {
  message: "Authorization Header must contain token"
})

export default {
  apiKey: z.object({
    [Header.API_KEY]: z.string().nonempty("API key is required"),
  }),
  auth: z.object({
    authorizaton: ZodAuthBearer,
  }),
}