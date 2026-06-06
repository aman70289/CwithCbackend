import {Router} from "express"
import { loginUser, registerUser,logoutUser,refreshAccessToken } from "../controllers/user.controller.js"
import {upload} from "../middleware/multer.middleware.js"
import {verifyJWT} from "../middleware/auth.middleware.js";


const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avtar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
registerUser
)

router.route("/login").post(loginUser)

//securedroutes

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-Token").post(refreshAccessToken)



export default router