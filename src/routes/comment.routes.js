import { Router } from "express";
import { deleteComment, getVideoComment,updateComment } from "../controllers/comment.controller";

const router=Router()

router.route("/comment").get(getVideoComment)
router.route("/comment/:commentId").patch(updateComment)
router.route("/comment/:commentId").delete(deleteComment)

export default router

