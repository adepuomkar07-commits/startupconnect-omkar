// ============================================================
// STARTUPCONNECT SERVER
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");


// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================================
// MONGODB
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {

    console.error(
        "❌ MONGO_URI is missing in .env"
    );

} else {

    mongoose
        .connect(MONGO_URI)
        .then(() => {

            console.log(
                "================================="
            );

            console.log(
                "✅ MongoDB connected successfully"
            );

            console.log(
                "================================="
            );

        })
        .catch((error) => {

            console.error(
                "❌ MongoDB connection failed:"
            );

            console.error(
                error.message
            );

        });

}


// ============================================================
// FRONTEND STATIC FILES
// ============================================================

const frontendFolder = __dirname;

console.log(
    "Frontend folder:",
    frontendFolder
);

app.use(
    express.static(frontendFolder)
);


// ============================================================
// MODELS
// ============================================================

const User = require("./user");

const Startup = require("./startup");

const Evaluation = require("./evaluationModel");


// ============================================================
// AUTH ROUTES
// ============================================================

const authRoutes =
    require("./auth");

app.use(
    "/api/auth",
    authRoutes
);


// ============================================================
// PROFILE ROUTES
// ============================================================

const profileRoutes =
    require("./profile");

app.use(
    "/api/profile",
    profileRoutes
);


// ============================================================
// STARTUP ROUTES
// ============================================================

const startupRoutes =
    require("./startupRoutes");

app.use(
    "/api/startups",
    startupRoutes
);


// ============================================================
// HEALTH API
// ============================================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "StartupConnect API is healthy",

            database:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected",

            timestamp:
                new Date().toISOString()

        });

    }
);


// ============================================================
// ROOT API
// ============================================================

app.get(
    "/api",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "StartupConnect API is running!",

            endpoints: {

                health:
                    "/api/health",

                register:
                    "/api/auth/register",

                login:
                    "/api/auth/login",

                forgotPassword:
                    "/api/auth/forgot-password",

                verifyCode:
                    "/api/auth/verify-code",

                resetPassword:
                    "/api/auth/reset-password",

                profile:
                    "/api/profile",

                startups:
                    "/api/startups",

                dashboardStats:
                    "/api/dashboard/stats",

                ai:
                    "/api/ai",

                evaluate:
                    "/api/evaluate"

            }

        });

    }
);


// ============================================================
// DASHBOARD STATISTICS
// GET /api/dashboard/stats
// ============================================================

app.get(
    "/api/dashboard/stats",
    async (req, res) => {

        try {

            // ==========================================
            // AUTHENTICATION
            // ==========================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authorization token is required"

                });

            }


            const token =
                authHeader.split(" ")[1];


            let decoded;

            try {

                decoded =
                    jwt.verify(
                        token,
                        process.env.JWT_SECRET
                    );

            } catch (error) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid or expired token"

                });

            }


            const userId =
                decoded.userId;


            // ==========================================
            // STARTUP COUNT
            // ==========================================

            const startupCount =
                await Startup.countDocuments({
                    founder: userId
                });


            // ==========================================
            // EVALUATION COUNT
            // ==========================================

            const evaluationCount =
                await Evaluation.countDocuments({
                    founder: userId
                });


            // ==========================================
            // AVERAGE SCORE
            // ==========================================

            const averageResult =
                await Evaluation.aggregate([

                    {
                        $match: {
                            founder:
                                new mongoose.Types.ObjectId(
                                    userId
                                )
                        }
                    },

                    {
                        $group: {

                            _id: null,

                            averageScore: {
                                $avg: "$overall"
                            }

                        }
                    }

                ]);


            let averageScore = 0;


            if (
                averageResult.length > 0 &&
                averageResult[0].averageScore !== null
            ) {

                averageScore =
                    Math.round(
                        averageResult[0].averageScore
                    );

            }


            // ==========================================
            // RECENT STARTUPS
            // ==========================================

            const recentStartups =
                await Startup.find({
                    founder: userId
                })
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .select(
                    "_id name industry description createdAt updatedAt"
                );


            // ==========================================
            // RECENT EVALUATIONS
            // ==========================================

            const recentEvaluations =
                await Evaluation.find({
                    founder: userId
                })
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .select(
                    "_id startup startupName industry overall verdict createdAt"
                );


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.status(200).json({

                success: true,

                stats: {

                    startups:
                        startupCount,

                    evaluations:
                        evaluationCount,

                    averageScore:
                        averageScore

                },

                recentStartups:
                    recentStartups,

                recentEvaluations:
                    recentEvaluations

            });

        } catch (error) {

            console.error(
                "❌ DASHBOARD STATS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load dashboard statistics"

            });

        }

    }
);


// ============================================================
// GEMINI AI CONFIGURATION
// ============================================================

const {
    GoogleGenAI
} = require("@google/genai");


const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


let gemini = null;


if (GEMINI_API_KEY) {

    gemini =
        new GoogleGenAI({
            apiKey:
                GEMINI_API_KEY
        });

    console.log(
        "🤖 Gemini AI configured."
    );

} else {

    console.log(
        "⚠️ GEMINI_API_KEY is missing."
    );

}


// ============================================================
// AI ASSISTANT
// POST /api/ai
// ============================================================

app.post(
    "/api/ai",
    async (req, res) => {

        try {

            // ==========================================
            // GET MESSAGE
            // ==========================================

            const {
                message
            } = req.body;


            if (
                !message ||
                typeof message !== "string" ||
                !message.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Message is required"

                });

            }


            // ==========================================
            // GEMINI CHECK
            // ==========================================

            if (!gemini) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Gemini AI is not configured"

                });

            }


            // ==========================================
            // PROMPT
            // ==========================================

            const prompt = `

You are StartupConnect AI Mentor.

You help startup founders with:

- Startup ideas
- Business models
- Market research
- Customer problems
- Product development
- Marketing
- Growth
- Funding
- Pitch preparation
- Startup strategy

Give practical, clear and useful answers.

User message:

${message.trim()}

`;


            console.log(
                "🤖 Sending message to Gemini..."
            );


            // ==========================================
            // GEMINI REQUEST
            // ==========================================

            const response =
                await gemini.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt

                });


            // ==========================================
            // EXTRACT RESPONSE
            // ==========================================

            const reply =
                typeof response.text === "string"
                    ? response.text.trim()
                    : "";


            console.log(
                "🤖 Gemini response:",
                reply
            );


            // ==========================================
            // EMPTY RESPONSE CHECK
            // ==========================================

            if (!reply) {

                console.error(
                    "❌ Gemini returned an empty response:"
                );

                console.error(
                    response
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Gemini returned an empty response"

                });

            }


            // ==========================================
            // SUCCESS
            // ==========================================

            return res.status(200).json({

                success: true,

                reply:
                    reply

            });


        } catch (error) {

            console.error(
                "❌ AI ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "AI service temporarily unavailable"

            });

        }

    }
);


// ============================================================
// AI STARTUP EVALUATION
// POST /api/evaluate
// ============================================================

app.post(
    "/api/evaluate",
    async (req, res) => {

        try {

            // ==========================================
            // AUTHENTICATION
            // ==========================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authorization token is required"

                });

            }


            const token =
                authHeader.split(" ")[1];


            let decoded;

            try {

                decoded =
                    jwt.verify(
                        token,
                        process.env.JWT_SECRET
                    );

            } catch (error) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid or expired token"

                });

            }


            // ==========================================
            // USER ID
            // ==========================================

            const userId =
                decoded.userId;


            // ==========================================
            // STARTUP DATA
            // ==========================================

            const {
                startupId,
                startupName,
                industry,
                description
            } = req.body;


            if (
                !startupName ||
                !industry ||
                !description
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Startup name, industry and description are required"

                });

            }


            // ==========================================
            // VERIFY STARTUP OWNERSHIP
            // ==========================================

            let startup = null;


            if (startupId) {

                startup =
                    await Startup.findOne({

                        _id:
                            startupId,

                        founder:
                            userId

                    });


                if (!startup) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Startup not found or you do not have access to it"

                    });

                }

            }


            // ==========================================
            // GEMINI CHECK
            // ==========================================

            if (!gemini) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Gemini AI is not configured"

                });

            }


            // ==========================================
            // GEMINI EVALUATION PROMPT
            // ==========================================

            const prompt = `
You are a professional startup evaluator.

Evaluate the following startup idea.

Startup Name:
${startupName}

Industry:
${industry}

Description:
${description}

Provide a structured evaluation.

Give scores from 0 to 100 for:

1. Market Opportunity
2. Problem Strength
3. Solution Quality
4. Innovation
5. Business Model
6. Scalability
7. Competition
8. Feasibility

Then provide:

- Overall Score
- Strengths
- Weaknesses
- Opportunities
- Risks
- Recommendations
- Final Verdict

Return the answer in clear JSON format:

{
    "marketOpportunity": 0,
    "problemStrength": 0,
    "solutionQuality": 0,
    "innovation": 0,
    "businessModel": 0,
    "scalability": 0,
    "competition": 0,
    "feasibility": 0,
    "overall": 0,
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "risks": [],
    "recommendations": [],
    "verdict": ""
}

Only return valid JSON.
`;


            console.log(
                "🤖 Sending startup to Gemini..."
            );


            // ==========================================
            // GEMINI REQUEST
            // ==========================================

            const response =
                await gemini.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt

                });


            // ==========================================
            // EXTRACT GEMINI RESPONSE
            // ==========================================

            let text =
                typeof response.text === "string"
                    ? response.text.trim()
                    : "";


            console.log(
                "🤖 Raw evaluation response:",
                text
            );


            // ==========================================
            // EMPTY RESPONSE CHECK
            // ==========================================

            if (!text) {

                console.error(
                    "❌ Gemini returned an empty evaluation response:"
                );

                console.error(
                    response
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Gemini returned an empty evaluation response"

                });

            }


            // ==========================================
            // REMOVE MARKDOWN JSON FENCES
            // ==========================================

            text =
                text
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();


            // ==========================================
            // PARSE AI RESPONSE
            // ==========================================

            let evaluation;


            try {

                evaluation =
                    JSON.parse(text);

            } catch (parseError) {

                console.error(
                    "❌ AI JSON parsing failed:"
                );

                console.error(
                    text
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "AI returned an invalid evaluation format"

                });

            }


            // ==========================================
            // NORMALIZE SCORES
            // ==========================================

            evaluation.marketOpportunity =
                Number(
                    evaluation.marketOpportunity
                ) || 0;


            evaluation.problemStrength =
                Number(
                    evaluation.problemStrength
                ) || 0;


            evaluation.solutionQuality =
                Number(
                    evaluation.solutionQuality
                ) || 0;


            evaluation.innovation =
                Number(
                    evaluation.innovation
                ) || 0;


            evaluation.businessModel =
                Number(
                    evaluation.businessModel
                ) || 0;


            evaluation.scalability =
                Number(
                    evaluation.scalability
                ) || 0;


            evaluation.competition =
                Number(
                    evaluation.competition
                ) || 0;


            evaluation.feasibility =
                Number(
                    evaluation.feasibility
                ) || 0;


            evaluation.overall =
                Number(
                    evaluation.overall
                ) || 0;


            // ==========================================
            // ENSURE ARRAYS
            // ==========================================

            evaluation.strengths =
                Array.isArray(
                    evaluation.strengths
                )
                    ? evaluation.strengths
                    : [];


            evaluation.weaknesses =
                Array.isArray(
                    evaluation.weaknesses
                )
                    ? evaluation.weaknesses
                    : [];


            evaluation.opportunities =
                Array.isArray(
                    evaluation.opportunities
                )
                    ? evaluation.opportunities
                    : [];


            evaluation.risks =
                Array.isArray(
                    evaluation.risks
                )
                    ? evaluation.risks
                    : [];


            evaluation.recommendations =
                Array.isArray(
                    evaluation.recommendations
                )
                    ? evaluation.recommendations
                    : [];


            evaluation.verdict =
                evaluation.verdict ||
                "";


            // ==========================================
            // STARTUP ID REQUIRED FOR MONGODB
            // ==========================================

            if (!startupId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Startup ID is required for saving the evaluation"

                });

            }


            // ==========================================
            // SAVE EVALUATION TO MONGODB
            // ==========================================

            const savedEvaluation =
                await Evaluation.create({

                    founder:
                        userId,

                    startup:
                        startupId,

                    startupName:
                        startupName,

                    industry:
                        industry,

                    description:
                        description,

                    marketOpportunity:
                        evaluation.marketOpportunity,

                    problemStrength:
                        evaluation.problemStrength,

                    solutionQuality:
                        evaluation.solutionQuality,

                    innovation:
                        evaluation.innovation,

                    businessModel:
                        evaluation.businessModel,

                    scalability:
                        evaluation.scalability,

                    competition:
                        evaluation.competition,

                    feasibility:
                        evaluation.feasibility,

                    overall:
                        evaluation.overall,

                    strengths:
                        evaluation.strengths,

                    weaknesses:
                        evaluation.weaknesses,

                    opportunities:
                        evaluation.opportunities,

                    risks:
                        evaluation.risks,

                    recommendations:
                        evaluation.recommendations,

                    verdict:
                        evaluation.verdict

                });


            // ==========================================
            // SUCCESS LOG
            // ==========================================

            console.log(
                "================================="
            );

            console.log(
                "✅ AI EVALUATION SUCCESS"
            );

            console.log(
                "Startup:",
                startupName
            );

            console.log(
                "Overall Score:",
                evaluation.overall
            );

            console.log(
                "MongoDB Evaluation ID:",
                savedEvaluation._id
            );

            console.log(
                "================================="
            );


            // ==========================================
            // RETURN RESULT
            // ==========================================

            return res.status(200).json({

                success: true,

                message:
                    "Startup evaluated and saved successfully",

                evaluation:
                    evaluation,

                evaluationId:
                    savedEvaluation._id

            });


        } catch (error) {

            console.error(
                "❌ EVALUATION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Startup evaluation failed"

            });

        }

    }
);


// ============================================================
// 404 API HANDLER
// ============================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found"

        });

    }
);


// ============================================================
// GENERAL ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "❌ Server error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "🚀 StartupConnect server running"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `❤️  http://localhost:${PORT}/api/health`
        );

        console.log(
            `👤 http://localhost:${PORT}/api/auth/register`
        );

        console.log(
            `🔐 http://localhost:${PORT}/api/auth/login`
        );

        console.log(
            `👤 http://localhost:${PORT}/api/profile`
        );

        console.log(
            `🚀 http://localhost:${PORT}/api/startups`
        );

        console.log(
            `📈 http://localhost:${PORT}/api/dashboard/stats`
        );

        console.log(
            `🤖 http://localhost:${PORT}/api/ai`
        );

        console.log(
            `📊 http://localhost:${PORT}/api/evaluate`
        );

        console.log(
            "================================="
        );

    }
);