import {mongoose,Schema, SchemaType} from "mongoose";


const likeSchema=new mongoose.Schema({
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }

},{timestamps:true})


export const Like=mongoose.model("Like",likeSchema)