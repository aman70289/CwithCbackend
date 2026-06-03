import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

    const existedUser= User.findOne({
        $or:[{ username},{ email }]
    })

    tf(existedUser){
        throw new ApiError(409,"user with username and email already existed")

    }

    const avtarLocalPath=req.files?.avtar[0]?.path;
    req.files?.coverImageLocalPath=req.files?.coverImage[0]?.path;
    if (!avtarLocalPath) {
        throw new ApiError(400,"Avtar file is required")
        
    }
    const avtar=await uploadOnCloudinary(avtarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!avtar) {
        throw new ApiError(400,"Avtar file is required")
        
    }

    const user = await User.create({
        fullName,
        avtar:avtar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await user.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})


export {registerUser}