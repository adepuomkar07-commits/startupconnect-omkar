document.addEventListener("DOMContentLoaded", function () {

    const results = document.getElementById("results");
    const loading = document.getElementById("loading");

    if (results) {
        results.style.display = "none";
    }

    if (loading) {
        loading.style.display = "none";
    }

});


// ==========================================
// ANALYZE STARTUP
// ==========================================

function runAI() {

    const idea =
        document.getElementById("startupIdea").value.trim();

    const targetCustomers =
        document.getElementById("targetCustomers").value.trim();

    const industry =
        document.getElementById("industry").value.trim();


    // VALIDATION

    if (idea === "") {

        alert("Please enter your startup idea.");

        return;
    }


    // SAVE DATA

    const startupData = {

        idea: idea,

        targetCustomers: targetCustomers,

        industry: industry

    };


    localStorage.setItem(
        "aiStartupData",
        JSON.stringify(startupData)
    );


    // SHOW LOADING

    document.getElementById("loading").style.display = "block";

    document.getElementById("results").style.display = "none";


    // SIMPLE DEMO ANALYSIS
    // Real AI backend will be connected next.

    setTimeout(function () {

        generateAnalysis(
            idea,
            targetCustomers,
            industry
        );

    }, 1500);

}


// ==========================================
// GENERATE ANALYSIS
// ==========================================

function generateAnalysis(
    idea,
    targetCustomers,
    industry
) {

    let score = 75;


    if (idea.length > 100) {
        score += 5;
    }

    if (targetCustomers.length > 10) {
        score += 5;
    }

    if (industry.length > 3) {
        score += 5;
    }


    if (score > 95) {
        score = 95;
    }


    // SCORE

    document.getElementById(
        "scoreValue"
    ).textContent = score;


    // STRENGTHS

    document.getElementById(
        "strengths"
    ).textContent =

        "The startup addresses a specific problem and has " +
        "potential to create value for its target customers. " +
        "The idea can be strengthened through customer validation.";


    // RISKS

    document.getElementById(
        "risks"
    ).textContent =

        "Competition, customer adoption and product-market fit " +
        "should be carefully validated before scaling the startup.";


    // MARKET

    document.getElementById(
        "market"
    ).textContent =

        targetCustomers
        ? "The identified target customers are: " +
          targetCustomers +
          ". Research their needs and willingness to pay."

        : "Define a specific target customer segment " +
          "and validate the market opportunity.";


    // RECOMMENDATIONS

    document.getElementById(
        "recommendations"
    ).textContent =

        "Build an MVP, speak with potential customers, " +
        "study competitors and measure real user demand " +
        "before investing heavily in development.";


    // HIDE LOADING

    document.getElementById(
        "loading"
    ).style.display = "none";


    // SHOW RESULTS

    document.getElementById(
        "results"
    ).style.display = "block";


    // SCROLL

    document.getElementById(
        "results"
    ).scrollIntoView({
        behavior: "smooth"
    });

}


// ==========================================
// OPEN EVALUATION
// ==========================================

function openEvaluation() {

    const idea =
        document.getElementById("startupIdea").value.trim();

    const targetCustomers =
        document.getElementById("targetCustomers").value.trim();

    const industry =
        document.getElementById("industry").value.trim();


    // SAVE AGAIN

    const startupData = {

        idea: idea,

        targetCustomers: targetCustomers,

        industry: industry

    };


    localStorage.setItem(
        "aiStartupData",
        JSON.stringify(startupData)
    );


    // OPEN EVALUATION PAGE

    window.location.href = "evaluation.html";

}