import express from "express"
import {
  createTodo,
  getTodos,
  editTodo,
  deleteTodo,
} from "../controllers/todoController.js"
import { protect } from "../middleware/authMiddleware.js"
import apiKey from "../auth/apiKey.js"
import { Permission } from "../models/ApiKeyModel.js"
import permission from "../helpers/permission.js"
import authentication from "../auth/authentication.js"
const router = express.Router()

router.use(apiKey)

router.use(permission(Permission.GENERAL))

router.route("/").post(protect, createTodo).get(authentication, getTodos)
router.route("/:id").put(protect, editTodo).delete(protect, deleteTodo)

export default router
