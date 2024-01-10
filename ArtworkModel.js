const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let artworkSchema = Schema({
    artist: {type: Schema.Types.ObjectId, ref: 'User'},
    title: {type: String, default: "n/a"},
    year: {type: String, default: "n/a"},
    category: {type: String, default: "n/a"},
    medium: {type: String, default: "n/a"},
    description: {type: String, default: "n/a"},
    poster: {type: String, default: "n/a"},
    likes: {type: Number, default: 0}
});


module.exports = mongoose.model("Artwork", artworkSchema);
