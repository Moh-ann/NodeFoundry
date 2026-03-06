import crypto from "crypto"
import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"
import generateToken from "../utils/generateToken.js"
import type { ProtectedRequest } from "../../types/app-request.js"
import type { Response } from "express"
import type mongoose from "mongoose"
import { BadRequestError } from "../core/CustomError.js"
import { userLoginSchema } from "../routes/userSchema.js"
import { create } from "./KeyStoreController.js"
import { environment, tokenInfo } from "../config.js"
import { createTokens, getAccessToken, validateTokenData } from "../auth/utils.js"
import JWT from "../core/JWT.js"
import { Types } from "mongoose"
import { KeyStoreModel } from "../models/KeyStoreModel.js"

const loginUser = asyncHandler(async (req: ProtectedRequest, res: Response) => {
  const { email, password } = req.body

  const data = userLoginSchema.safeParse({ email, password})

  if(!data.success){
    throw new BadRequestError("Invalid User Credentials")
  }

  const user = await User.findOne({ email })

  if (user && (await user?.matchPassword?.(password))) {
    const accessTokenKey = crypto.randomBytes(64).toString("hex")
    const refreshTokenKey = crypto.randomBytes(64).toString("hex")
    await create(user, accessTokenKey, refreshTokenKey)
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey)

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: environment === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    })
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: environment === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, 
    })
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    })
  } else {
    throw new BadRequestError("Invalid User Credentials")
  }
})

const registerUser = asyncHandler(async (req: ProtectedRequest, res: Response) => {
  const { name, email, password } = req.body

  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error("User already Exists")
  }

  const user = await User.create({ name, email, password })

  if (user) {
    generateToken(res, user._id as mongoose.Types.ObjectId)
    res.status(201)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    })
  } else {
    res.status(400)
    throw new Error("Invalid User Credentials")
  }
})

export const refreshAccessToken = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    req.accessToken = getAccessToken(req.headers.authorization)
    
    const accessTokenPayload = await JWT.decode(req.cookies.accessToken)
    validateTokenData(accessTokenPayload)

    const user = await User.findById(new Types.ObjectId(accessTokenPayload.sub))
    if (!user) throw new BadRequestError("User not registered")
    req.user = user

    const refreshTokenPayload = await JWT.validate(
      req.body.refreshToken,
      tokenInfo.secret
    )
    validateTokenData(refreshTokenPayload)

    if (accessTokenPayload.sub !== refreshTokenPayload.sub)
      throw new BadRequestError("Invalid access token")

    const keystore = await KeyStoreModel.find({
      client: req.user,
      primaryKey: accessTokenPayload.prm,
      secondaryKey: refreshTokenPayload.prm,
    })

    if (!keystore) throw new BadRequestError("Invalid access token")
    await KeyStoreModel.deleteOne({
      client: req.user,
      primaryKey: accessTokenPayload.prm,
      secondaryKey: refreshTokenPayload.prm,
    })

    const accessTokenKey = crypto.randomBytes(64).toString("hex")
    const refreshTokenKey = crypto.randomBytes(64).toString("hex")

    await create(req.user, accessTokenKey, refreshTokenKey)
    const tokens = await createTokens(req.user, accessTokenKey, refreshTokenKey)

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: environment === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, //ms
    })

    res.status(200).json({
      message: "Access Token Refreshed",
    })
  }
)

// const forgotPassword = asyncHandler(async (req: ProtectedRequest, res: Response) => {
//   const { email } = req.body

//   const user = await User.findOne({ email })

//   if (!user) {
//     res.status(404)
//     throw new Error("User Not Found")
//   }

//   const resetToken = user.createPasswordResetToken()
//   user.save()

//   const resetUrl = `${req.protocol}://localhost:3000/reset-password/${resetToken}`

//   const message = `Forgot Password? Click on this this link to reset your Password: ${resetUrl}`

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: "Your Password reset token. (valid for 10mins)",
//       message,
//     })

//     res.status(200).json({
//       message: "Token Sent to email!",
//     })
//   } catch (error) {
//     user.passwordResetToken = undefined
//     user.passwordResetExpires = undefined
//     user.save()
//     console.log(error)

//     res.status(500).json({
//       status: "error",
//       message:
//         "There was an error in sending the email. Please Try again later",
//     })
//   }
// })

// const resetPassword = asyncHandler(async (req: ProtectedRequest, res: Response) => {
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(req.params.resetToken)
//     .digest("hex")

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   })

//   if (!user) {
//     res.status(400).json({
//       status: "fail",
//       message: "Token is invalid or has expired",
//     })
//   }

//   user.password = req.body.password
//   user.passwordResetToken = undefined
//   user.passwordResetExpires = undefined
//   user.save()

//   generateToken(res, user._id)

//   res.json({
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     isAdmin: user.isAdmin,
//   })
// })

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  })
  res.status(200).json({
    message: "Logged Out Successfully",
  })
})

export { loginUser, registerUser, logoutUser }
