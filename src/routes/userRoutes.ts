import express from "express"
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/userController.js"
import validateRequest, { ValidationSource } from "../helpers/validator.js"
import { refreshTokenSchema, userLoginSchema, userRegisterSchema } from "./userSchema.js"
import apiKey from "../auth/apiKey.js"

const router = express.Router()

router.use(apiKey)

router.route("/login").post(validateRequest(userLoginSchema, ValidationSource.BODY), loginUser)
router.route("/register").post(validateRequest(userRegisterSchema, ValidationSource.BODY), registerUser)

router.route("/refresh").post(validateRequest(refreshTokenSchema, ValidationSource.BODY), refreshAccessToken)



router.route("/logout").get(logoutUser)

export default router
