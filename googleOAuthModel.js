const mongoose = require("mongoose");

const googleOAuthSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        googleEmail: {
            type: String,
            required: true
        },

        accessToken: {
            type: String,
            required: true
        },

        refreshToken: {
            type: String,
            required: true
        },

        expiryDate: {
            type: Number,
            required: false
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("GoogleOAuth", googleOAuthSchema);