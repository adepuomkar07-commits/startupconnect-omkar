const express = require("express");
const jwt = require("jsonwebtoken");
const Startup = require("./startup");

const router = express.Router();


// =====================================
// JWT AUTHENTICATION
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


        const parts = authHeader.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });

        }


        const token = parts[1];


        if (!process.env.JWT_SECRET) {

            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is missing in .env"
            });

        }


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        req.user = decoded;


        next();

    } catch (error) {

        console.error(
            "Startup authentication error:",
            error.message
        );


        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }

}



// =====================================
// GET ALL MY STARTUPS
// GET /api/startups
// =====================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const startups = await Startup.find({
                founder: req.user.userId
            }).sort({
                createdAt: -1
            });


            return res.status(200).json({

                success: true,

                startups: startups

            });

        } catch (error) {

            console.error(
                "Get startups error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Server error while retrieving startups"

            });

        }

    }
);



// =====================================
// CREATE STARTUP
// POST /api/startups
// =====================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                name,
                industry,
                description
            } = req.body;


            if (
                !name ||
                !industry ||
                !description
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "All startup fields are required"

                });

            }


            const startup = await Startup.create({

                founder:
                    req.user.userId,

                name:
                    name.trim(),

                industry:
                    industry.trim(),

                description:
                    description.trim()

            });


            return res.status(201).json({

                success: true,

                message:
                    "Startup created successfully",

                startup: startup

            });

        } catch (error) {

            console.error(
                "Create startup error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Server error while creating startup"

            });

        }

    }
);



// =====================================
// UPDATE STARTUP
// PUT /api/startups/:id
// =====================================

router.put(
    "/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                name,
                industry,
                description
            } = req.body;


            if (
                !name ||
                !industry ||
                !description
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "All startup fields are required"

                });

            }


            const startup = await Startup.findOne({

                _id:
                    req.params.id,

                founder:
                    req.user.userId

            });


            if (!startup) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Startup not found"

                });

            }


            startup.name =
                name.trim();


            startup.industry =
                industry.trim();


            startup.description =
                description.trim();


            await startup.save();


            return res.status(200).json({

                success: true,

                message:
                    "Startup updated successfully",

                startup: startup

            });

        } catch (error) {

            console.error(
                "Update startup error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Server error while updating startup"

            });

        }

    }
);



// =====================================
// DELETE STARTUP
// DELETE /api/startups/:id
// =====================================

router.delete(
    "/:id",
    authenticateToken,
    async (req, res) => {

        try {

            const startup =
                await Startup.findOneAndDelete({

                    _id:
                        req.params.id,

                    founder:
                        req.user.userId

                });


            if (!startup) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Startup not found"

                });

            }


            return res.status(200).json({

                success: true,

                message:
                    "Startup deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete startup error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Server error while deleting startup"

            });

        }

    }
);



module.exports = router;