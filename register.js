const registerForm =
    document.getElementById("registerForm");

const registerBtn =
    document.getElementById("registerBtn");

const message =
    document.getElementById("message");


/* =====================================================
   PASSWORD SHOW / HIDE
===================================================== */

const togglePassword =
    document.getElementById("togglePassword");

const password =
    document.getElementById("password");


if (togglePassword && password) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (password.type === "password") {

                password.type = "text";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye-slash"></i>';

            } else {

                password.type = "password";

                togglePassword.innerHTML =
                    '<i class="fa-solid fa-eye"></i>';

            }

        }
    );

}


/* =====================================================
   REGISTRATION
===================================================== */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            /* =================================================
               GET FORM VALUES
            ================================================= */

            const startupName =
                document
                    .getElementById("startupName")
                    .value
                    .trim();


            const founderName =
                document
                    .getElementById("founderName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();


            const passwordValue =
                password.value;


            const industry =
                document
                    .getElementById("industry")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            /* =================================================
               VALIDATION
            ================================================= */

            if (
                !startupName ||
                !founderName ||
                !email ||
                !passwordValue
            ) {

                showMessage(
                    "Please fill all required fields.",
                    "error"
                );

                return;

            }


            if (passwordValue.length < 6) {

                showMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            /* =================================================
               DISABLE BUTTON
            ================================================= */

            registerBtn.disabled = true;

            registerBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';


            try {

                console.log("=================================");
                console.log("📝 REGISTERING USER...");
                console.log("Founder:", founderName);
                console.log("Email:", email);
                console.log("Startup:", startupName);
                console.log("=================================");


                /* =================================================
                   SEND DATA TO NODE.JS
                   
                   IMPORTANT:
                   Send BOTH "name" and "founderName"
                   so the backend accepts the founder name.
                ================================================= */

                const response =
                    await fetch(
                        "/api/auth/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                name:
                                    founderName,

                                founderName:
                                    founderName,

                                startupName:
                                    startupName,

                                email:
                                    email,

                                password:
                                    passwordValue,

                                industry:
                                    industry,

                                description:
                                    description

                            })
                        }
                    );


                /* =================================================
                   READ RESPONSE
                ================================================= */

                const data =
                    await response.json();


                console.log(
                    "REGISTER RESPONSE:",
                    data
                );


                /* =================================================
                   HANDLE ERROR
                ================================================= */

                if (!response.ok) {

                    showMessage(
                        data.message ||
                        "Registration failed.",
                        "error"
                    );

                    console.error(
                        "❌ REGISTRATION FAILED:",
                        data
                    );

                    return;

                }


                /* =================================================
                   SUCCESS
                ================================================= */

                console.log(
                    "✅ REGISTRATION SUCCESSFUL"
                );


                showMessage(
                    "Registration successful! Redirecting...",
                    "success"
                );


                /* =================================================
                   SAVE JWT TOKEN
                   
                   Use the same key used by the rest of
                   StartupConnect.
                ================================================= */

                if (data.token) {

                    localStorage.setItem(
                        "startupconnect_token",
                        data.token
                    );

                    /*
                     * Keep token as well for compatibility
                     * with older StartupConnect pages.
                     */

                    localStorage.setItem(
                        "token",
                        data.token
                    );

                }


                /* =================================================
                   SAVE USER
                ================================================= */

                if (data.user) {

                    localStorage.setItem(
                        "startupconnect_user",
                        JSON.stringify(data.user)
                    );

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                }


                /* =================================================
                   REDIRECT
                ================================================= */

                setTimeout(
                    () => {

                        window.location.href =
                            "founder-dashboard.html";

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "❌ REGISTRATION ERROR:",
                    error
                );


                showMessage(
                    "Cannot connect to the server. Make sure Node.js is running.",
                    "error"
                );


            } finally {

                registerBtn.disabled =
                    false;

                registerBtn.innerHTML =
                    '<i class="fa-solid fa-user-plus"></i> Create Account';

            }

        }
    );

}


/* =====================================================
   MESSAGE FUNCTION
===================================================== */

function showMessage(
    text,
    type
) {

    message.textContent =
        text;


    message.style.color =
        type === "success"
            ? "#16a34a"
            : "#dc2626";

}