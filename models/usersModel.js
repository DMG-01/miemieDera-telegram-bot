const mongoose = require("mongoose")

const userModel = new mongoose.Schema({
    userId: {
        type:Number,
        required: [true, "user id is required"]
    },
    firstName: {
        type:String,
        required:[true,"firstName is required"]
    },
    lastName: {
        type:String
    },
    userName: {
        type:String,
        required:[true,"userName is required"]
    }
    
},{timestamps:true})

module.exports = mongoose.model("user",userModel)

