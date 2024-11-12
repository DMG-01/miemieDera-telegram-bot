const mongoose = require("mongoose");
const pptxCount = new mongoose.Schema({
    numberOfCount: {
        type:Number,
        default:0
    }, id: {
        type:Number,
        default:1,
        unique:true
    }
}, {timestamps:true})

module.exports = mongoose.model("pptxCount", pptxCount)