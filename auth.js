const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("./user");

const router = express.Router();


// =====================================================
// GMAIL EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});


// =====================================================
// TEST EMAIL CONNECTION
// =====================================================

transporter.verify((error, success) => {

    if (error) {

        console.error("❌ Gmail SMTP connection failed:");
        console.error(error.message);

    } else {

        console.log("✅ Gmail SMTP is ready.");

    }

});


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            founderName,
            email,
            password
        } = req.body;


        /*
         * Accept both:
         *
         * name
         * founderName
         *
         * This keeps the frontend compatible.
         */

        const finalName =
            (founderName || name || "").trim();


        if (
            !finalName ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and password are required."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        /*
         * CHECK WHETHER EMAIL ALREADY EXISTS
         */

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "An account with this email already exists."

            });

        }


        /*
         * HASH PASSWORD
         */

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        /*
         * CREATE NEW USER
         */

        const user =
            await User.create({

                name:
                    finalName,

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                role:
                    "user"

            });


        console.log("---------------------------------");
        console.log("✅ NEW USER REGISTERED");
        console.log("Name:", user.name);
        console.log("Email:", user.email);
        console.log("User ID:", user._id);
        console.log("---------------------------------");


        // =================================================
        // CREATE JWT FOR THE NEW USER
        // =================================================

        const token =
            jwt.sign(

                {
                    userId:
                        user._id,

                    email:
                        user.email,

                    role:
                        user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }

            );


        // =================================================
        // RETURN NEW TOKEN
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Registration successful.",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                role:
                    user.role

            }

        });


    } catch (error) {

        console.error(
            "❌ REGISTER ERROR:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Registration failed."

        });

    }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        console.log("🔎 LOGIN DEBUG");
        console.log("Email found:", user.email);
        console.log("Password received:", !!password);
        console.log(
            "Stored password starts with:",
            user.password.substring(0, 10)
        );
        console.log(
            "Password match:",
            passwordMatch
        );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        const token =
            jwt.sign(

                {
                    userId:
                        user._id,

                    email:
                        user.email,

                    role:
                        user.role

                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }

            );


        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                role:
                    user.role

            }

        });


    } catch (error) {

        console.error(
            "❌ LOGIN ERROR:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }

});


// =====================================================
// FORGOT PASSWORD
// SEND CODE TO USER EMAIL
// =====================================================

router.post("/forgot-password", async (req, res) => {

    try {

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email address is required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "No account found with this email address."

            });

        }


        // =================================================
        // GENERATE 6 DIGIT VERIFICATION CODE
        // =================================================

        const resetCode =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();


        // =================================================
        // CODE EXPIRES AFTER 5 MINUTES
        // =================================================

        const resetCodeExpiry =
            new Date(
                Date.now() +
                5 * 60 * 1000
            );


        // =================================================
        // SAVE CODE IN MONGODB
        // =================================================

        user.resetCode =
            resetCode;

        user.resetCodeExpiry =
            resetCodeExpiry;


        await user.save();


        console.log("---------------------------------");
        console.log("🔐 PASSWORD RESET CODE");
        console.log("Email:", normalizedEmail);
        console.log("Code:", resetCode);
        console.log("Expires:", resetCodeExpiry);
        console.log("---------------------------------");


        // =================================================
        // EMAIL CONTENT
        // =================================================

        const mailOptions = {

            from:
                `"StartupConnect" <${process.env.EMAIL_USER}>`,

            to:
                normalizedEmail,

            subject:
                "StartupConnect - Password Reset Verification Code",

            text:
                `Hello ${user.name},

Your StartupConnect password reset verification code is:

${resetCode}

This code will expire in 5 minutes.

If you did not request a password reset, please ignore this email.

StartupConnect
Secure Password Recovery`,

            html: `

<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>
        StartupConnect Password Reset
    </title>

</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f5f5f7;
    font-family: Arial, Helvetica, sans-serif;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background-color: #f5f5f7;
        padding: 40px 15px;
    "
>

<tr>

<td align="center">

<table
    width="600"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width: 600px;
        width: 100%;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
    "
>

<tr>

<td
    align="center"
    style="
        padding: 30px 25px 20px 25px;
    "
>

<h1 style="
    margin: 0;
    font-size: 28px;
    color: #6c4cff;
">

StartupConnect

</h1>

</td>

</tr>


<tr>

<td
    style="
        padding: 10px 40px 35px 40px;
        color: #333333;
    "
>

<p style="
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 15px 0;
">

Hello ${user.name},

</p>

<p style="
    font-size: 15px;
    line-height: 1.6;
    color: #555555;
    margin: 0 0 20px 0;
">

We received a request to reset
your StartupConnect password.

</p>

<p style="
    font-size: 15px;
    line-height: 1.6;
    color: #555555;
    margin: 0 0 10px 0;
">

Your verification code is:

</p>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>

<tr>

<td
    align="center"
    style="
        padding: 25px 10px;
        background-color: #f0edff;
        border-radius: 12px;
    "
>

<span style="
    font-size: 32px;
    font-weight: bold;
    letter-spacing: 8px;
    color: #5b3fd3;
">

${resetCode}

</span>

</td>

</tr>

</table>

<p style="
    font-size: 14px;
    line-height: 1.6;
    color: #777777;
    text-align: center;
    margin: 15px 0 25px 0;
">

This code expires in
<strong>5 minutes</strong>.

</p>

<p style="
    font-size: 14px;
    line-height: 1.6;
    color: #666666;
">

Enter this code on the StartupConnect
verification page to continue resetting
your password.

</p>

<p style="
    font-size: 14px;
    line-height: 1.6;
    color: #666666;
">

If you did not request a password reset,
you can safely ignore this email.

</p>

</td>

</tr>


<tr>

<td
    align="center"
    style="
        padding: 20px;
        background-color: #fafafa;
        border-top: 1px solid #eeeeee;
    "
>

<p style="
    margin: 0;
    font-size: 12px;
    color: #999999;
">

StartupConnect
• Secure Password Recovery

</p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>

`

        };


        // =================================================
        // SEND EMAIL
        // =================================================

        console.log(
            "📧 Sending verification email to:",
            normalizedEmail
        );


        const emailResult =
            await transporter.sendMail(
                mailOptions
            );


        console.log(
            "✅ Verification email sent."
        );

        console.log(
            "Message ID:",
            emailResult.messageId
        );


        return res.status(200).json({

            success: true,

            message:
                "Verification code has been sent to your email."

        });


    } catch (error) {

        console.error(
            "❌ FORGOT PASSWORD ERROR:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Unable to send verification code. Please try again."

        });

    }

});


// =====================================================
// VERIFY CODE
// =====================================================

router.post("/verify-code", async (req, res) => {

    try {

        const {
            email,
            code
        } = req.body;


        if (!email || !code) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and verification code are required."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        if (
            !user.resetCode ||
            !user.resetCodeExpiry
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No active verification code found."

            });

        }


        if (
            new Date() >
            user.resetCodeExpiry
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Verification code has expired. Please request a new code."

            });

        }


        if (
            user.resetCode !==
            code.toString().trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid verification code."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Verification code verified successfully."

        });


    } catch (error) {

        console.error(
            "❌ VERIFY CODE ERROR:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify code."

        });

    }

});


// =====================================================
// RESET PASSWORD
// =====================================================

router.post("/reset-password", async (req, res) => {

    try {

        const {
            email,
            code,
            newPassword
        } = req.body;


        if (
            !email ||
            !code ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email, verification code and new password are required."

            });

        }


        if (newPassword.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 6 characters."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        if (
            !user.resetCode ||
            !user.resetCodeExpiry
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No active password reset request."

            });

        }


        if (
            new Date() >
            user.resetCodeExpiry
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Verification code has expired."

            });

        }


        if (
            user.resetCode !==
            code.toString().trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid verification code."

            });

        }


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        user.password =
            hashedPassword;


        user.resetCode =
            null;

        user.resetCodeExpiry =
            null;


        await user.save();


        console.log(
            "================================="
        );

        console.log(
            "✅ PASSWORD RESET SUCCESSFUL"
        );

        console.log(
            "Email:",
            normalizedEmail
        );

        console.log(
            "================================="
        );


        return res.status(200).json({

            success: true,

            message:
                "Password reset successfully."

        });


    } catch (error) {

        console.error(
            "❌ RESET PASSWORD ERROR:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                "Unable to reset password."

        });

    }

});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;