const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let workshopSchema = Schema({
    artist: {type: Schema.Types.ObjectId, ref: 'User'},
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {type: String, default: "n/a"},
    enrolled: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model("Workshop", workshopSchema);


