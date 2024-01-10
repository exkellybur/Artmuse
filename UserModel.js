const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    accountType:{
        type: String,
        enum: ["patron", "artist"],
        default: "patron",
    },
    likes: [{type: Schema.Types.ObjectId, ref: 'Artwork'}],
    following: [{type: Schema.Types.ObjectId, ref: 'User'}],
    notifications: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String }
    }]

});

userSchema.methods.findArtworks = function(callback){
    this.model("Artwork").find()
    .where("artist").equals(this._id)
    .populate("artist")
    .exec()
    .then(callback);
};

module.exports = mongoose.model("User", userSchema);


