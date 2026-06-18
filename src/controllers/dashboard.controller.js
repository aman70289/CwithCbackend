import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {

    const channelId = req.user._id;

    const totalVideos = await Video.countDocuments({
        owner: channelId
    });

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    const totalViewsResult = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ]);

    const totalViews =
        totalViewsResult.length > 0
            ? totalViewsResult[0].totalViews
            : 0;

    const videos = await Video.find({
        owner: channelId
    }).select("_id");

    const videoIds = videos.map(video => video._id);

    const totalLikes = await Like.countDocuments({
        video: {
            $in: videoIds
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalSubscribers,
                totalViews,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {

    const videos = await Video.find({
        owner: req.user._id
    }).sort({
        createdAt: -1
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos
};