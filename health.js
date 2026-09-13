const express = require("express");

const router = express.Router();

console.log("=================================");
console.log("HEALTH ROUTE FILE LOADED");
console.log("=================================");

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "StartupConnect API is healthy",
        mongodb: "Connected"
    });
});

module.exports = router;