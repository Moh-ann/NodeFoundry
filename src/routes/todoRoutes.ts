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
import role from "../helpers/role.js"
import { RoleCode } from "../models/roleModel.js"
import authorization from "../auth/authorization.js"
const router = express.Router()

router.use(apiKey)

router.use(permission(Permission.GENERAL))

router.use(authentication)

router.route("/").post(protect, createTodo).get(role(RoleCode.ADMIN), authorization, getTodos)
router.route("/:id").put(protect, editTodo).delete(deleteTodo)

export default router
