import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken}


    } catch (error) {
        //throw new ApiError(500,"Something went wrong while generating refresh and access token");
         console.log("ACTUAL ERROR =>", error);
        throw error;
    }
}

const registerUser=asyncHandler(async (req,res) => {
    //get user details from frontend
    //validation -not empty
    //check if user already exist :username ,email
    //check for image ,check for avtar
    //upload them to cloudinary,avtar
    //create user object-create entry in db
    //renove password and refrresh token field from response
    //check for user creation
    //return res


    const {fullName,email,username,password}=req.body
    console.log("email: ",email);

    if (
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"All field are required")
        
    }

    const existedUser= await User.findOne({
        $or:[{ username},{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"user with username and email already existed")

    }
    console.log(req.files);

    const avtarLocalPath=req.files?.avtar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar file is required")
        
    }
    const avtar=await uploadOnCloudinary(avtarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar file is required")
        
    }

    const user = await User.create({
        fullName,
        avtar:avtar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})


const loginUser=asyncHandler(async(req,res)=>{
    //req body-> data
    //username or email
    //find the user
    //password check
    //access and refesh token
    //send cookie

    const {email,username,password}=req.body;

    if (!username&&!email) {
        throw new ApiError("username or email is required");
        
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if (!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401,"invalid user credentials");
        
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    )
})

    const logoutUser=asyncHandler(async(req,res)=>{

        await User.findByIdAndUpdate(req.user._id,
            {
                $set:{
                    refreshToken:undefined
                }
            },
            {
                new:true
            }
        )

        const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
      
    })

 
    const refreshAccessToken= asyncHandler(async(req,res)=>{

       const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken

       if (!incomingRefreshToken) {
         throw new ApiError(401,"unauthorised request")
       }

       const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
       )
       
       try {
        const user=await User.findById(decodedToken?._id)
 
         if (!user) {
             throw new ApiError(401,"invalid refresh token")
         }
        if (incomingRefreshToken!==user?.refreshToken) {
          throw new ApiError(401,"Refresh token in expired or used")
        }
        const options={
         httpOnly:true,
         secure:true
        }
 
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
 
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
         new ApiResponse(
             200,
             {accessToken,refreshToken:newRefreshToken},
             "Access token refreshed"
 
         )
        )
       } catch (error) {
         throw new ApiError(4001,error?.message)
         "Invalid refresh Token"
       }
       
    })

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if (!fullName||!email) {
        throw new ApiError(400,"All fields are required")
        
    }
    const user=User.findByIdAndUpdate(
        req.user?.id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new :true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvtar=asyncHandler(async (req,res) => {
    const avtarLocalPath=req.file?.path
    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar file is missing")
    }
    const avtar=await uploadOnCloudinary(avtarLocalPath)

    if (!avtar.url) {
        throw new ApiError(400,"Error while uploading on avtar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avtar:avtar.url
            }
        }
    )
     return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avtar image updated successfully")
    )


})

const updateUserCoverImage=asyncHandler(async (req,res) => {
    const coverImageLocalPath=req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover image file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalP)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading on coverimage")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
            coverImage:coverImage.url
            }
        },
        {new:true}

    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover image updated successfully")
    )


})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if (!username?.trim()) {
        throw new ApiError(400,"username is missing")
        
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
       { 
        $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
        }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avtar:1,
                coverImage:1,
                email:1,

            }
        }
    ])
})

if (!channel.length) {
    throw new ApiError(404,"channel does not exists")
}
return res
.status(200)
.json(
    new ApiResponse(200,"user channel fetched successfully")
)


const getWatchHistory=asyncHandler(async (req,res) => {
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avtar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

};