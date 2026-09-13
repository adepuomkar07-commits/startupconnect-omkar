const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema(
    {
        founder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: [true, "Startup name is required"],
            trim: true
        },

        industry: {
            type: String,
            required: [true, "Industry is required"],
            trim: true
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Startup", startupSchema);