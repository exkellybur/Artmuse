const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let reviewSchema = Schema({
    artwork: {type: Schema.Types.ObjectId, ref: 'Artwork'},
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    text: String,

});

module.exports = mongoose.model("Review", reviewSchema);
