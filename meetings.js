// =====================================================
// MEETING SCHEDULER
// =====================================================


// =====================================================
// DISPLAY SELECTED INVESTOR
// =====================================================

document.getElementById("investor").value =
    localStorage.getItem("selectedInvestor") || "No Investor Selected";


// =====================================================
// GET LOGIN TOKEN
// =====================================================

const token = localStorage.getItem("token");


// =====================================================
// ELEMENTS
// =====================================================

const googleStatus =
    document.getElementById("googleStatus");

const connectGoogleBtn =
    document.getElementById("connectGoogleBtn");

const successBox =
    document.getElementById("successBox");

const bookMeetingBtn =
    document.getElementById("bookMeetingBtn");


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(message, type = "success") {

    successBox.style.display = "block";

    successBox.innerHTML = message;

    if (type === "error") {

        successBox.style.color = "#d32f2f";

    } else {

        successBox.style.color = "#198754";

    }

}


// =====================================================
// CHECK LOGIN
// =====================================================

if (!token) {

    googleStatus.innerHTML =
        "⚠️ Please login to StartupConnect first.";

    connectGoogleBtn.style.display = "none";

    bookMeetingBtn.disabled = true;

    showMessage(
        "❌ Please login before scheduling a meeting.",
        "error"
    );

} else {

    checkGoogleConnection();

}


// =====================================================
// CHECK GOOGLE CONNECTION
// =====================================================

async function checkGoogleConnection() {

    try {

        googleStatus.innerHTML =
            "🔄 Checking Gmail connection...";

        connectGoogleBtn.style.display = "none";


        const response = await fetch(
            "/api/google/status",
            {

                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"

                }

            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to check Gmail connection."
            );

        }


        if (data.connected) {

            googleStatus.innerHTML =
                `✅ Gmail connected: <strong>${data.googleEmail}</strong>`;

            connectGoogleBtn.style.display =
                "none";

            bookMeetingBtn.disabled =
                false;

        } else {

            googleStatus.innerHTML =
                "⚠️ Connect your Gmail account before booking the meeting.";

            connectGoogleBtn.style.display =
                "inline-block";

            bookMeetingBtn.disabled =
                true;

        }


    } catch (error) {

        console.error(
            "❌ Google connection check error:",
            error
        );


        googleStatus.innerHTML =
            "❌ Unable to check Gmail connection.";

        connectGoogleBtn.style.display =
            "inline-block";

        bookMeetingBtn.disabled =
            true;

    }

}


// =====================================================
// CONNECT GOOGLE GMAIL
// =====================================================

connectGoogleBtn.addEventListener(
    "click",
    async function () {

        try {

            if (!token) {

                showMessage(
                    "❌ Please login to StartupConnect first.",
                    "error"
                );

                return;

            }


            connectGoogleBtn.disabled =
                true;

            connectGoogleBtn.innerHTML =
                "🔄 Connecting...";


            const response =
                await fetch(
                    "/api/google/auth",
                    {

                        method: "GET",

                        headers: {

                            "Authorization":
                                `Bearer ${token}`

                        }

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to start Google authentication."
                );

            }


            if (!data.authUrl) {

                throw new Error(
                    "Google authentication URL was not returned."
                );

            }


            // Redirect founder to Google OAuth
            window.location.href =
                data.authUrl;


        } catch (error) {

            console.error(
                "❌ Google OAuth error:",
                error
            );


            showMessage(
                "❌ Unable to connect Gmail. Please try again.",
                "error"
            );


            connectGoogleBtn.disabled =
                false;

            connectGoogleBtn.innerHTML =
                '<i class="fa-brands fa-google"></i> Connect Gmail';

        }

    }
);


// =====================================================
// CHECK GOOGLE CALLBACK RESULT
// =====================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const googleResult =
    urlParams.get("google");


if (googleResult === "connected") {

    showMessage(
        "✅ Gmail connected successfully! You can now book your investor meeting."
    );


    // Remove ?google=connected from URL
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );


    // Check connection again
    checkGoogleConnection();

}


// =====================================================
// BOOK MEETING
// =====================================================

document
    .getElementById("meetingForm")
    .addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            // -----------------------------------------
            // CHECK LOGIN
            // -----------------------------------------

            const currentToken =
                localStorage.getItem("token");


            if (!currentToken) {

                showMessage(
                    "❌ Please login before booking a meeting.",
                    "error"
                );

                return;

            }


            // -----------------------------------------
            // CHECK GOOGLE CONNECTION
            // -----------------------------------------

            try {

                const googleResponse =
                    await fetch(
                        "/api/google/status",
                        {

                            method: "GET",

                            headers: {

                                "Authorization":
                                    `Bearer ${currentToken}`

                            }

                        }
                    );


                const googleData =
                    await googleResponse.json();


                if (
                    !googleResponse.ok ||
                    !googleData.connected
                ) {

                    showMessage(
                        "⚠️ Please connect your Gmail account first.",
                        "error"
                    );

                    connectGoogleBtn.style.display =
                        "inline-block";

                    return;

                }


                // -----------------------------------------
                // CREATE MEETING OBJECT
                // -----------------------------------------

                const meeting = {

                    investor:
                        document.getElementById(
                            "investor"
                        ).value,

                    date:
                        document.getElementById(
                            "meetingDate"
                        ).value,

                    time:
                        document.getElementById(
                            "meetingTime"
                        ).value,

                    mode:
                        document.getElementById(
                            "meetingMode"
                        ).value,

                    purpose:
                        document.getElementById(
                            "purpose"
                        ).value,

                    status:
                        "Pending"

                };


                // -----------------------------------------
                // DISABLE BUTTON
                // -----------------------------------------

                bookMeetingBtn.disabled =
                    true;

                bookMeetingBtn.innerHTML =
                    "📧 Sending Meeting Request...";


                // -----------------------------------------
                // SEND TO BACKEND
                // -----------------------------------------

                const response =
                    await fetch(
                        "/api/meetings",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${currentToken}`

                            },

                            body:
                                JSON.stringify(meeting)

                        }
                    );


                const data =
                    await response.json();


                // -----------------------------------------
                // HANDLE GOOGLE AUTH REQUIRED
                // -----------------------------------------

                if (
                    response.status === 401 &&
                    data.requiresGoogleAuth
                ) {

                    showMessage(
                        "⚠️ Please connect your Gmail account first.",
                        "error"
                    );


                    connectGoogleBtn.style.display =
                        "inline-block";


                    bookMeetingBtn.disabled =
                        false;

                    bookMeetingBtn.innerHTML =
                        "📅 Book Meeting";

                    return;

                }


                // -----------------------------------------
                // HANDLE OTHER ERRORS
                // -----------------------------------------

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to submit meeting request."
                    );

                }


                // -----------------------------------------
                // SAVE EXISTING LOCAL STORAGE DATA
                // -----------------------------------------

                localStorage.setItem(
                    "meeting",
                    JSON.stringify(meeting)
                );


                // -----------------------------------------
                // SUCCESS
                // -----------------------------------------

                showMessage(
                    `✅ Meeting request sent successfully!<br><br>
                     📧 From: ${data.sentFrom || googleData.googleEmail}<br>
                     📨 To: ${data.sentTo || "Investor"}`
                );


                // -----------------------------------------
                // RESET FORM
                // -----------------------------------------

                document
                    .getElementById("meetingDate")
                    .value = "";

                document
                    .getElementById("meetingTime")
                    .value = "";

                document
                    .getElementById("purpose")
                    .value = "";


                bookMeetingBtn.disabled =
                    false;

                bookMeetingBtn.innerHTML =
                    "📅 Book Meeting";


            } catch (error) {

                console.error(
                    "❌ Meeting request error:",
                    error
                );


                showMessage(
                    "❌ Failed to send meeting request. Please try again.",
                    "error"
                );


                bookMeetingBtn.disabled =
                    false;

                bookMeetingBtn.innerHTML =
                    "📅 Book Meeting";

            }

        }
    );