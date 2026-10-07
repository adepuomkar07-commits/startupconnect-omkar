const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
    {
        investor: {
            type: String,
            required: true
        },

        founder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        mode: {
            type: String,
            required: true
        },

        purpose: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Meeting", meetingSchema);