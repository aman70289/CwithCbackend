import { Comment } from "../models/comment.model";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getVideoComment=asyncHandler(
    async (req,res) => {
        const {videoId}= req.params;

        const userComment=await Comment.find({
            video:videoId
        })
         return res
         .status(200)
         .json(
            new ApiResponse(200,userComment,"fetched of comment succssful")
         )
        }
)

const addComment=async (req,res) => {
    const {videoId}=req.params
    
    
}





export {getVideoComment};