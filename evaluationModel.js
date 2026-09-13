const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
    {
        founder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Startup",
            required: true
        },

        startupName: {
            type: String,
            required: true,
            trim: true
        },

        industry: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        marketOpportunity: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        problemStrength: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        solutionQuality: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        innovation: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        businessModel: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        scalability: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        competition: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        feasibility: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        overall: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        strengths: {
            type: [String],
            default: []
        },

        weaknesses: {
            type: [String],
            default: []
        },

        opportunities: {
            type: [String],
            default: []
        },

        risks: {
            type: [String],
            default: []
        },

        recommendations: {
            type: [String],
            default: []
        },

        verdict: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Evaluation",
        evaluationSchema
    );