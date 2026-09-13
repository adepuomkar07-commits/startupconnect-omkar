const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./user");

const router = express.Router();

// =====================================
// JWT AUTH MIDDLEWARE
// =====================================

function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        // Expected format:
        // Authorization: Bearer YOUR_TOKEN

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const token = parts[1];

        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is missing in .env"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        console.error("Authentication error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}


// =====================================
// GET USER PROFILE
// GET /api/profile
// =====================================

router.get("/", authenticateToken, async (req, res) => {

    try {

        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,

                phone: user.phone || "",
                bio: user.bio || "",
                linkedin: user.linkedin || "",
                website: user.website || "",
                skills: user.skills || [],
                photo: user.photo || "",

                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {

        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving profile"
        });
    }
});


// =====================================
// UPDATE USER PROFILE
// PUT /api/profile
// =====================================

router.put("/", authenticateToken, async (req, res) => {

    try {

        const {
            name,
            phone,
            bio,
            linkedin,
            website,
            skills,
            photo
        } = req.body;


        // =====================================
        // VALIDATE NAME
        // =====================================

        if (!name || !name.trim()) {

            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }


        // =====================================
        // FIND LOGGED-IN USER
        // =====================================

        const user = await User.findById(req.user.userId);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // =====================================
        // UPDATE BASIC PROFILE INFORMATION
        // =====================================

        user.name = name.trim();

        user.phone = typeof phone === "string"
            ? phone.trim()
            : "";

        user.bio = typeof bio === "string"
            ? bio.trim()
            : "";

        user.linkedin = typeof linkedin === "string"
            ? linkedin.trim()
            : "";

        user.website = typeof website === "string"
            ? website.trim()
            : "";


        // =====================================
        // UPDATE SKILLS
        // =====================================

        if (Array.isArray(skills)) {

            user.skills = skills
                .filter(skill => typeof skill === "string")
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

        } else {

            user.skills = [];
        }


        // =====================================
        // UPDATE PROFILE PHOTO
        // =====================================

        if (typeof photo === "string") {

            user.photo = photo;

        } else {

            user.photo = "";
        }


        // =====================================
        // SAVE TO MONGODB
        // =====================================

        await user.save();


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(200).json({

            success: true,

            message: "Profile updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,

                phone: user.phone || "",
                bio: user.bio || "",
                linkedin: user.linkedin || "",
                website: user.website || "",
                skills: user.skills || [],
                photo: user.photo || "",

                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {

        console.error("Profile update error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating profile"
        });
    }
});


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;