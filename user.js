const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // =========================
        // ACCOUNT INFORMATION
        // =========================
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"]
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        // =========================
        // FOUNDER PROFILE
        // =========================
        phone: {
            type: String,
            default: "",
            trim: true
        },

        bio: {
            type: String,
            default: "",
            trim: true
        },

        linkedin: {
            type: String,
            default: "",
            trim: true
        },

        website: {
            type: String,
            default: "",
            trim: true
        },

        skills: {
            type: [String],
            default: []
        },

        photo: {
            type: String,
            default: ""
        },

        // =========================
        // PASSWORD RESET
        // =========================
        resetCode: {
            type: String,
            default: null
        },

        resetCodeExpiry: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);