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


export {registerUser,loginUser,logoutUser,refreshAccessToken};