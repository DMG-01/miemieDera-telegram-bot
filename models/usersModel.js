const mongoose = require("mongoose")

const userModel = new mongoose.Schema({
    userId: {
        type:Number,
        required: [true, "please enter "]
    }
})