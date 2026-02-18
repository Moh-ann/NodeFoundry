import { Request } from "express"

declare interface ProtectedRequest extends Request {
    user?: User;
}
