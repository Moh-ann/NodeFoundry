import { Request } from "express"

declare interface ProtectedRequest extends Request {
    accessToken?: string | undefined;
    user?: User;
}
