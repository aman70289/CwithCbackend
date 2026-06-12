import { Router } from "express";
import { getVideoComment } from "../controllers/comment.controller";

const router=Router()

router.route("/comment").get(getVideoComment)

export default router

