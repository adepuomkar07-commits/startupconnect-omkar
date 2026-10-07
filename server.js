// ============================================================
// STARTUPCONNECT SERVER
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");


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

const User =
    require("./user");

const Startup =
    require("./startup");

const Evaluation =
    require("./evaluationModel");

const Meeting =
    require("./meetingModel");

const GoogleOAuth =
    require("./googleOAuthModel");


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
                    "/api/evaluate",

                googleAuth:
                    "/api/google/auth",

                googleStatus:
                    "/api/google/status",

                meetings:
                    "/api/meetings"

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

            if (!gemini) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Gemini AI is not configured"

                });

            }

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

            const response =
                await gemini.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt

                });

            const reply =
                typeof response.text === "string"
                    ? response.text.trim()
                    : "";

            console.log(
                "🤖 Gemini response:",
                reply
            );

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

            const response =
                await gemini.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt

                });

            let text =
                typeof response.text === "string"
                    ? response.text.trim()
                    : "";

            console.log(
                "🤖 Raw evaluation response:",
                text
            );

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
                evaluation.verdict || "";


            // ==========================================
            // STARTUP ID REQUIRED
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
// GOOGLE OAUTH CONFIGURATION
// ============================================================

const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET;

const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI;

let googleOAuthClient = null;

if (
    GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_SECRET &&
    GOOGLE_REDIRECT_URI
) {

    googleOAuthClient =
        new google.auth.OAuth2(

            GOOGLE_CLIENT_ID,

            GOOGLE_CLIENT_SECRET,

            GOOGLE_REDIRECT_URI

        );

    console.log(
        "🔐 Google OAuth configured."
    );

} else {

    console.log(
        "⚠️ Google OAuth environment variables are missing."
    );

}


// ============================================================
// GOOGLE GMAIL SCOPE
// ============================================================

const GOOGLE_GMAIL_SCOPES = [

    "https://www.googleapis.com/auth/gmail.send"

];


// ============================================================
// AUTHENTICATION HELPER
// ============================================================

function getAuthenticatedUserId(req) {

    const authHeader =
        req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {

        return null;

    }

    const token =
        authHeader.split(" ")[1];

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        return decoded.userId;

    } catch (error) {

        return null;

    }

}


// ============================================================
// GOOGLE CONNECT
// GET /api/google/auth
// ============================================================

app.get(
    "/api/google/auth",
    async (req, res) => {

        try {

            if (!googleOAuthClient) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Google OAuth is not configured"

                });

            }

            const userId =
                getAuthenticatedUserId(req);

            if (!userId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Valid login token is required"

                });

            }


            // ==========================================
            // STATE TOKEN
            // ==========================================

            const state =
                jwt.sign(

                    {
                        userId:
                            userId,

                        purpose:
                            "google-gmail-connect"

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "10m"
                    }

                );


            // ==========================================
            // GOOGLE AUTH URL
            // ==========================================

            const authUrl =
                googleOAuthClient.generateAuthUrl({

                    access_type:
                        "offline",

                    prompt:
                        "consent",

                    scope:
                        GOOGLE_GMAIL_SCOPES,

                    state:
                        state

                });


            return res.status(200).json({

                success: true,

                authUrl:
                    authUrl

            });

        } catch (error) {

            console.error(
                "❌ GOOGLE AUTH ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to start Google authorization"

            });

        }

    }
);


// ============================================================
// GOOGLE OAUTH CALLBACK
// GET /api/auth/google/callback
// ============================================================

app.get(
    "/api/auth/google/callback",
    async (req, res) => {

        try {

            const {
                code,
                state,
                error
            } = req.query;


            // ==========================================
            // GOOGLE DENIED ACCESS
            // ==========================================

            if (error) {

                console.error(
                    "❌ Google OAuth denied:",
                    error
                );

                return res.redirect(
                    "/meetings.html?google=denied"
                );

            }


            // ==========================================
            // REQUIRED DATA
            // ==========================================

            if (!code || !state) {

                return res.redirect(
                    "/meetings.html?google=failed"
                );

            }


            // ==========================================
            // VERIFY STATE
            // ==========================================

            let decodedState;

            try {

                decodedState =
                    jwt.verify(
                        state,
                        process.env.JWT_SECRET
                    );

            } catch (error) {

                console.error(
                    "❌ Invalid Google OAuth state:",
                    error.message
                );

                return res.redirect(
                    "/meetings.html?google=failed"
                );

            }


            if (
                !decodedState.userId ||
                decodedState.purpose !==
                    "google-gmail-connect"
            ) {

                return res.redirect(
                    "/meetings.html?google=failed"
                );

            }


            const userId =
                decodedState.userId;


            // ==========================================
            // EXCHANGE CODE FOR TOKENS
            // ==========================================

            if (!googleOAuthClient) {

                return res.redirect(
                    "/meetings.html?google=failed"
                );

            }

            const {
                tokens
            } =
                await googleOAuthClient.getToken(
                    code
                );


            // ==========================================
            // USER GOOGLE CLIENT
            // ==========================================

            const userGoogleClient =
                new google.auth.OAuth2(

                    GOOGLE_CLIENT_ID,

                    GOOGLE_CLIENT_SECRET,

                    GOOGLE_REDIRECT_URI

                );

            userGoogleClient.setCredentials(
                tokens
            );


            // ==========================================
            // GET GOOGLE ACCOUNT EMAIL
            // ==========================================

            const oauth2 =
                google.oauth2({

                    auth:
                        userGoogleClient,

                    version:
                        "v2"

                });

            const {
                data: googleUser
            } =
                await oauth2.userinfo.get();


            const googleEmail =
                googleUser.email;


            if (!googleEmail) {

                return res.redirect(
                    "/meetings.html?google=failed"
                );

            }


            // ==========================================
            // CHECK EXISTING CONNECTION
            // ==========================================

            const existingConnection =
                await GoogleOAuth.findOne({

                    user:
                        userId

                });


            let refreshToken =
                tokens.refresh_token;


            if (
                !refreshToken &&
                existingConnection
            ) {

                refreshToken =
                    existingConnection.refreshToken;

            }


            if (!refreshToken) {

                console.error(
                    "❌ No refresh token received from Google."
                );

                return res.redirect(
                    "/meetings.html?google=reauthorize"
                );

            }


            // ==========================================
            // SAVE / UPDATE GOOGLE OAUTH
            // ==========================================

            await GoogleOAuth.findOneAndUpdate(

                {
                    user:
                        userId
                },

                {

                    user:
                        userId,

                    googleEmail:
                        googleEmail,

                    accessToken:
                        tokens.access_token,

                    refreshToken:
                        refreshToken,

                    expiryDate:
                        tokens.expiry_date

                },

                {

                    upsert:
                        true,

                    new:
                        true,

                    setDefaultsOnInsert:
                        true

                }

            );


            console.log(
                "================================="
            );

            console.log(
                "✅ Google Gmail connected"
            );

            console.log(
                "StartupConnect User:",
                userId
            );

            console.log(
                "Google Email:",
                googleEmail
            );

            console.log(
                "================================="
            );


            // ==========================================
            // RETURN TO MEETINGS PAGE
            // ==========================================

            return res.redirect(
                "/meetings.html?google=connected"
            );

        } catch (error) {

            console.error(
                "❌ GOOGLE CALLBACK ERROR:",
                error
            );

            return res.redirect(
                "/meetings.html?google=failed"
            );

        }

    }
);


// ============================================================
// GOOGLE CONNECTION STATUS
// GET /api/google/status
// ============================================================

app.get(
    "/api/google/status",
    async (req, res) => {

        try {

            const userId =
                getAuthenticatedUserId(req);

            if (!userId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Valid login token is required"

                });

            }


            const connection =
                await GoogleOAuth.findOne({

                    user:
                        userId

                });


            if (!connection) {

                return res.status(200).json({

                    success: true,

                    connected:
                        false,

                    googleEmail:
                        null

                });

            }


            return res.status(200).json({

                success: true,

                connected:
                    true,

                googleEmail:
                    connection.googleEmail

            });

        } catch (error) {

            console.error(
                "❌ GOOGLE STATUS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to check Google connection"

            });

        }

    }
);


// ============================================================
// INVESTOR EMAIL MAP
// ============================================================

const investorEmails = {

    Omkar:
        process.env.OMKAR_EMAIL,

    Abhishek:
        process.env.ABHISHEK_EMAIL,

    Nikesh:
        process.env.NIKESH_EMAIL

};


// ============================================================
// CREATE GMAIL MESSAGE
// ============================================================

function createRawEmail({

    from,
    to,
    replyTo,
    subject,
    text

}) {

    const message = [

        `From: ${from}`,

        `To: ${to}`,

        `Reply-To: ${replyTo}`,

        `Subject: ${subject}`,

        "Content-Type: text/plain; charset=UTF-8",

        "",

        text

    ].join("\r\n");


    return Buffer
        .from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

}


// ============================================================
// MEETING ROUTE
// POST /api/meetings
// ============================================================

app.post(
    "/api/meetings",
    async (req, res) => {

        try {

            // ==========================================
            // AUTHENTICATION
            // ==========================================

            const userId =
                getAuthenticatedUserId(req);

            if (!userId) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login before requesting a meeting"

                });

            }


            // ==========================================
            // GET FOUNDER
            // ==========================================

            const founder =
                await User.findById(
                    userId
                );


            if (!founder) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Founder account not found"

                });

            }


            // ==========================================
            // MEETING DATA
            // ==========================================

            const {
                investor,
                date,
                time,
                mode,
                purpose
            } = req.body;


            if (
                !investor ||
                !date ||
                !time ||
                !mode ||
                !purpose
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Investor, date, time, mode and purpose are required"

                });

            }


            // ==========================================
            // INVESTOR EMAIL
            // ==========================================

            const investorEmail =
                investorEmails[investor];


            if (!investorEmail) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Investor email is not configured"

                });

            }


            // ==========================================
            // GOOGLE OAUTH CONNECTION
            // ==========================================

            const googleConnection =
                await GoogleOAuth.findOne({

                    user:
                        userId

                });


            if (!googleConnection) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Please connect your Gmail account before requesting a meeting",

                    requiresGoogleAuth:
                        true

                });

            }


            // ==========================================
            // SAVE MEETING
            // ==========================================

            const meeting =
                await Meeting.create({

                    investor:
                        investor,

                    founder:
                        userId,

                    date:
                        date,

                    time:
                        time,

                    mode:
                        mode,

                    purpose:
                        purpose,

                    status:
                        "Pending"

                });


            console.log(
                "✅ Meeting request saved:",
                meeting._id
            );


            // ==========================================
            // CREATE FOUNDER GOOGLE CLIENT
            // ==========================================

            const founderGoogleClient =
                new google.auth.OAuth2(

                    GOOGLE_CLIENT_ID,

                    GOOGLE_CLIENT_SECRET,

                    GOOGLE_REDIRECT_URI

                );


            founderGoogleClient.setCredentials({

                access_token:
                    googleConnection.accessToken,

                refresh_token:
                    googleConnection.refreshToken,

                expiry_date:
                    googleConnection.expiryDate

            });


            // ==========================================
            // GMAIL API
            // ==========================================

            const gmail =
                google.gmail({

                    version:
                        "v1",

                    auth:
                        founderGoogleClient

                });


            // ==========================================
            // EMAIL CONTENT
            // ==========================================

            const founderName =
                founder.name ||
                founder.fullName ||
                founder.email;


            const subject =
                `StartupConnect Meeting Request from ${founderName}`;


            const emailText = `

Hello ${investor},

You have received a new meeting request through StartupConnect.

Founder:
${founderName}

Founder Email:
${founder.email}

Requested Date:
${date}

Requested Time:
${time}

Meeting Mode:
${mode}

Purpose:
${purpose}

Please reply directly to this email to communicate with the founder.

Regards,
${founderName}
StartupConnect

`;


            // ==========================================
            // CREATE RAW EMAIL
            // ==========================================

            const rawEmail =
                createRawEmail({

                    from:
                        googleConnection.googleEmail,

                    to:
                        investorEmail,

                    replyTo:
                        founder.email,

                    subject:
                        subject,

                    text:
                        emailText

                });


            // ==========================================
            // SEND EMAIL USING GMAIL API
            // ==========================================

            const gmailResponse =
                await gmail.users.messages.send({

                    userId:
                        "me",

                    requestBody: {

                        raw:
                            rawEmail

                    }

                });


            console.log(
                "================================="
            );

            console.log(
                "📧 Meeting email sent successfully"
            );

            console.log(
                "From:",
                googleConnection.googleEmail
            );

            console.log(
                "To:",
                investorEmail
            );

            console.log(
                "Gmail Message ID:",
                gmailResponse.data.id
            );

            console.log(
                "================================="
            );


            // ==========================================
            // RESPONSE
            // ==========================================

            return res.status(201).json({

                success: true,

                message:
                    "Meeting request submitted and email sent successfully",

                meeting:
                    meeting,

                sentFrom:
                    googleConnection.googleEmail,

                sentTo:
                    investorEmail

            });

        } catch (error) {

            console.error(
                "❌ MEETING ERROR:",
                error
            );


            // ==========================================
            // GMAIL AUTH ERROR
            // ==========================================

            if (
                error.code === 401 ||
                error.code === 403
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your Gmail connection has expired or does not have permission to send email. Please reconnect Gmail.",

                    requiresGoogleAuth:
                        true

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Failed to submit meeting request"

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
            `🔗 http://localhost:${PORT}/api/google/auth`
        );

        console.log(
            `📧 http://localhost:${PORT}/api/meetings`
        );

        console.log(
            "================================="
        );

    }
);