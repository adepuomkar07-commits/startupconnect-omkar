const token = localStorage.getItem("startupconnect_token");

let selectedStartup = null;
let currentEvaluation = null;


/* =========================================
   SESSION CHECK
========================================= */

function checkSession() {
    const currentToken = localStorage.getItem("startupconnect_token");

    if (!currentToken) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* =========================================
   CLEAR LOGIN DATA
========================================= */

function clearLoginData() {
    localStorage.removeItem("startupconnect_token");
    localStorage.removeItem("startupconnect_user");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem("loggedIn");
    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem("currentUser");
    localStorage.removeItem("selectedStartup");
}


/* =========================================
   HANDLE UNAUTHORIZED
========================================= */

function handleUnauthorized(message) {
    console.error("Authentication error:", message);

    clearLoginData();

    window.location.href = "login.html";
}


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!checkSession()) {
        return;
    }

    loadStartup();

});


/* =========================================
   LOAD SELECTED STARTUP
========================================= */

function loadStartup() {

    const startupData =
        localStorage.getItem("selectedStartup");

    const startupArea =
        document.getElementById("startupArea");

    if (!startupData) {

        if (startupArea) {
            startupArea.innerHTML = `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#777;
                ">
                    <i class="fa-solid fa-rocket"
                       style="
                           font-size:35px;
                           margin-bottom:15px;
                           display:block;
                       ">
                    </i>

                    <strong>No startup selected</strong>

                    <p style="margin-top:8px;">
                        Please go to My Startups and select a startup first.
                    </p>
                </div>
            `;
        }

        return;
    }


    try {

        selectedStartup =
            JSON.parse(startupData);

        console.log(
            "SELECTED STARTUP:",
            selectedStartup
        );


        const startupName =
            selectedStartup.name ||
            selectedStartup.startupName ||
            "Startup";


        const startupIndustry =
            selectedStartup.industry ||
            "Industry";


        const startupDescription =
            selectedStartup.description ||
            "No description available.";


        if (startupArea) {

            startupArea.innerHTML = `
                <div class="startup-banner">

                    <div class="startup-banner-icon">
                        <i class="fa-solid fa-rocket"></i>
                    </div>

                    <div class="startup-banner-info">

                        <h2>
                            ${escapeHTML(startupName)}
                        </h2>

                        <span>
                            ${escapeHTML(startupIndustry)}
                        </span>

                        <p>
                            ${escapeHTML(startupDescription)}
                        </p>

                    </div>

                </div>

                <button
                    id="evaluateBtn"
                    class="evaluate-btn"
                    onclick="evaluateStartup()"
                >
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    Evaluate Startup
                </button>
            `;

        }

    } catch (error) {

        console.error(
            "Failed to parse selected startup:",
            error
        );

        localStorage.removeItem("selectedStartup");

        showError(
            "Unable to load the selected startup."
        );
    }
}


/* =========================================
   EVALUATE STARTUP
========================================= */

async function evaluateStartup() {

    if (!checkSession()) {
        return;
    }


    if (!selectedStartup) {

        showError(
            "Please select a startup first."
        );

        return;
    }


    const currentToken =
        localStorage.getItem(
            "startupconnect_token"
        );


    if (!currentToken) {

        handleUnauthorized(
            "Authentication token is missing."
        );

        return;
    }


    const loading =
        document.getElementById("loading");

    const results =
        document.getElementById("results");

    const errorBox =
        document.getElementById("errorBox");

    const evaluateBtn =
        document.getElementById("evaluateBtn");


    if (errorBox) {
        errorBox.classList.remove("show");
        errorBox.textContent = "";
    }


    if (results) {
        results.style.display = "none";
    }


    if (loading) {
        loading.style.display = "flex";
    }


    if (evaluateBtn) {
        evaluateBtn.disabled = true;

        evaluateBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Evaluating...
        `;
    }


    try {

        console.log(
            "🚀 Sending startup for AI evaluation..."
        );


        const response =
            await fetch(
                `${API_URL}/api/evaluate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${currentToken}`
                    },

                    body: JSON.stringify({

                        startupId:
                            selectedStartup._id ||
                            selectedStartup.id ||
                            null,

                        startupName:
                            selectedStartup.name ||
                            selectedStartup.startupName ||
                            "",

                        industry:
                            selectedStartup.industry ||
                            "",

                        description:
                            selectedStartup.description ||
                            ""
                    })
                }
            );


        const rawText =
            await response.text();


        console.log(
            "EVALUATION RAW RESPONSE:",
            rawText
        );


        let data = null;


        try {

            data =
                rawText
                    ? JSON.parse(rawText)
                    : null;

        } catch (parseError) {

            console.error(
                "Evaluation JSON parse error:",
                parseError
            );

            throw new Error(
                "Server returned an invalid response."
            );
        }


        /* =====================================
           UNAUTHORIZED
        ===================================== */

        if (response.status === 401) {

            const message =
                data &&
                data.message
                    ? data.message
                    : "Unauthorized request.";


            if (
                message.toLowerCase().includes("invalid") ||
                message.toLowerCase().includes("expired") ||
                message.toLowerCase().includes("token") ||
                message.toLowerCase().includes("authorization")
            ) {

                handleUnauthorized(message);

                return;
            }


            throw new Error(message);
        }


        /* =====================================
           OTHER HTTP ERRORS
        ===================================== */

        if (!response.ok) {

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : `Evaluation failed (${response.status})`
            );
        }


        if (!data) {

            throw new Error(
                "Empty response received from server."
            );
        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "AI evaluation failed."
            );
        }


        if (!data.evaluation) {

            throw new Error(
                "Evaluation data was not returned by the server."
            );
        }


        /* =====================================
           SAVE CURRENT EVALUATION
        ===================================== */

        currentEvaluation =
            data.evaluation;


        console.log(
            "✅ AI EVALUATION SUCCESS"
        );


        console.log(
            "EVALUATION:",
            currentEvaluation
        );


        if (data.evaluationId) {

            currentEvaluation._id =
                data.evaluationId;
        }


        /* =====================================
           SAVE LOCAL LATEST EVALUATION
        ===================================== */

        try {

            localStorage.setItem(
                "latestEvaluation",
                JSON.stringify(
                    currentEvaluation
                )
            );

        } catch (storageError) {

            console.warn(
                "Could not save evaluation locally:",
                storageError
            );
        }


        /* =====================================
           DISPLAY EVALUATION
        ===================================== */

        displayEvaluation(
            currentEvaluation
        );


    } catch (error) {

        console.error(
            "❌ EVALUATION ERROR:",
            error
        );


        showError(
            error.message ||
            "Unable to evaluate startup."
        );


    } finally {

        if (loading) {
            loading.style.display = "none";
        }


        if (evaluateBtn) {

            evaluateBtn.disabled = false;

            evaluateBtn.innerHTML = `
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                Evaluate Again
            `;
        }
    }
}


/* =========================================
   DISPLAY EVALUATION
========================================= */

function displayEvaluation(evaluation) {

    if (!evaluation) {
        return;
    }


    const results =
        document.getElementById("results");


    if (results) {
        results.style.display = "block";
    }


    /* =====================================
       SCORE VALUES
    ===================================== */

    const overall =
        normalizeScore(
            evaluation.overall
        );


    const market =
        normalizeScore(
            evaluation.marketOpportunity
        );


    const innovation =
        normalizeScore(
            evaluation.innovation
        );


    const feasibility =
        normalizeScore(
            evaluation.feasibility
        );


    const businessModel =
        normalizeScore(
            evaluation.businessModel
        );


    const competition =
        normalizeScore(
            evaluation.competition
        );


    /* =====================================
       OVERALL SCORE
    ===================================== */

    const overallElement =
        document.getElementById("overall");


    if (overallElement) {

        overallElement.textContent =
            `${overall}`;
    }


    const scoreTitle =
        document.getElementById("scoreTitle");


    if (scoreTitle) {

        scoreTitle.textContent =
            getScoreTitle(overall);
    }


    const scoreDescription =
        document.getElementById(
            "scoreDescription"
        );


    if (scoreDescription) {

        scoreDescription.textContent =
            getScoreDescription(overall);
    }


    /* =====================================
       METRICS
    ===================================== */

    updateMetric(
        "marketValue",
        "marketBar",
        market
    );


    updateMetric(
        "innovationValue",
        "innovationBar",
        innovation
    );


    updateMetric(
        "feasibilityValue",
        "feasibilityBar",
        feasibility
    );


    updateMetric(
        "businessModelValue",
        "businessModelBar",
        businessModel
    );


    updateMetric(
        "competitionValue",
        "competitionBar",
        competition
    );


    /* =====================================
       STRENGTHS
    ===================================== */

    renderList(
        "strengths",
        evaluation.strengths
    );


    /* =====================================
       WEAKNESSES
    ===================================== */

    renderList(
        "weaknesses",
        evaluation.weaknesses
    );


    /* =====================================
       RECOMMENDATIONS
    ===================================== */

    renderList(
        "recommendations",
        evaluation.recommendations
    );


    /* =====================================
       SUMMARY
    ===================================== */

    const summary =
        document.getElementById("summary");


    if (summary) {

        const summaryText =
            evaluation.summary ||
            evaluation.verdict ||
            "No summary was provided.";

        summary.innerHTML =
            escapeHTML(summaryText)
                .replace(/\n/g, "<br>");
    }


    /* =====================================
       SMOOTH SCROLL
    ===================================== */

    if (results) {

        setTimeout(() => {

            results.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 200);
    }
}


/* =========================================
   UPDATE METRIC
========================================= */

function updateMetric(
    valueId,
    barId,
    score
) {

    const valueElement =
        document.getElementById(valueId);


    const barElement =
        document.getElementById(barId);


    if (valueElement) {

        valueElement.textContent =
            `${score}/100`;
    }


    if (barElement) {

        barElement.style.width =
            `${score}%`;
    }
}


/* =========================================
   NORMALIZE SCORE
========================================= */

function normalizeScore(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return 0;
    }


    return Math.max(
        0,
        Math.min(
            100,
            Math.round(number)
        )
    );
}


/* =========================================
   SCORE TITLE
========================================= */

function getScoreTitle(score) {

    if (score >= 80) {
        return "Excellent Startup Potential";
    }

    if (score >= 70) {
        return "Strong Startup Potential";
    }

    if (score >= 60) {
        return "Good Startup Potential";
    }

    if (score >= 50) {
        return "Moderate Startup Potential";
    }

    if (score >= 40) {
        return "Needs Improvement";
    }

    return "High Improvement Needed";
}


/* =========================================
   SCORE DESCRIPTION
========================================= */

function getScoreDescription(score) {

    if (score >= 80) {

        return "Your startup shows strong potential across multiple important business factors.";

    }

    if (score >= 70) {

        return "Your startup has a strong foundation with several promising opportunities.";

    }

    if (score >= 60) {

        return "Your startup has good potential, but several areas can still be improved.";

    }

    if (score >= 50) {

        return "Your startup has a reasonable foundation, but needs further validation and refinement.";

    }

    if (score >= 40) {

        return "Your startup has potential, but important business areas require improvement.";

    }

    return "Your startup needs significant refinement before it is ready for strong market validation.";
}


/* =========================================
   RENDER LIST
========================================= */

function renderList(
    elementId,
    items
) {

    const element =
        document.getElementById(elementId);


    if (!element) {
        return;
    }


    let list = [];


    if (Array.isArray(items)) {

        list = items;

    } else if (
        typeof items === "string" &&
        items.trim()
    ) {

        list =
            items
                .split("\n")
                .map(item => item.trim())
                .filter(Boolean);
    }


    if (list.length === 0) {

        element.innerHTML = `
            <li>No information available.</li>
        `;

        return;
    }


    element.innerHTML =
        list
            .map(item => {

                return `
                    <li>
                        ${escapeHTML(String(item))}
                    </li>
                `;

            })
            .join("");
}


/* =========================================
   SHOW ERROR
========================================= */

function showError(message) {

    const errorBox =
        document.getElementById("errorBox");


    if (!errorBox) {

        alert(message);

        return;
    }


    errorBox.textContent =
        message;


    errorBox.classList.add("show");


    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    setTimeout(() => {

        errorBox.classList.remove("show");

    }, 7000);
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}