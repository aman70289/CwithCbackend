import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";

const toggleVideoLike=asyncHandler(
    async (req,res) => {
        const {videoId}=req.params
        const alreadyLiked=await Like.findOne(
            {
                video:videoId,
                owner:req.user._id
        }
        )
        if(alreadyLiked){
            await Like.findByIdAndDelete(alreadyLiked._id)

            return res
            .status(200)
            .json(
                new ApiResponse(200,{},"video dislike successfully")
            )
        }
        await Like.create({
            video:videoId,
            owner:req.user._id
        });

        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"video liked")
        )
        
    }
)

const toggleCommentLike=asyncHandler(async (req,res) => {
    const {commentId}=req.params;
    const alreadyLiked=await Like.findOne(
    {  comment:commentId,
       owner:req.user._id
    }
    )
    if(alreadyLiked){
       await Like.findByIdAndDelete(alreadyLiked._id);
       return res
       .status(200)
       .json(new ApiResponse(200,{},"comment unliked"))
    }
    await Like.create(
        {
            comment:commentId,
            owner:req.user._id
        }
    )
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment liked "))

})



const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.find({
        owner: req.user._id
    }).populate("video");

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    );
});


export {
    toggleVideoLike,
    videoLike,
    toggleCommentLike,
    getLikedVideos
}