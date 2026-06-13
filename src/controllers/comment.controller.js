import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError";
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

const addComment=asyncHandler(
    async (req,res) => {
    const {videoId,content}=req.body;
    if(!content?.trim()){
        return res
        .status(400)
        .json(
            new ApiResponse(400,content,"content is required")
        )
    };
    
    
}
)

const updateComment=asyncHandler(
    async(req,res)=>{
        const {commentId}=req.params
        const {content}=req.body
        if(!content?.trim())
        {
            return res
            .status(400)
            .json(
                new ApiResponse(400,content,"Content is required")
            )
        }
        const comment=await Comment.findByIdAndUpdate(
            commentId,
            {
            $set: { content }
            },
            {
            new: true
            }
        )

        if(!comment)
        {
            throw new ApiError(404,"Comment not found")
        }

         return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        ))

    } 

)





export {getVideoComment};