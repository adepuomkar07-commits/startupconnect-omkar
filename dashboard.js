document.addEventListener("DOMContentLoaded", function () {

    // ==============================
    // USER NAME
    // ==============================

    const founderName =
        localStorage.getItem("founderName");

    const userName =
        document.getElementById("userName");

    if (userName && founderName) {
        userName.textContent = founderName;
    }


    // ==============================
    // LATEST EVALUATION
    // ==============================

    const savedEvaluation =
        JSON.parse(
            localStorage.getItem("latestEvaluation")
        );


    if (savedEvaluation) {

        const score =
            document.getElementById("aiScore");

        const summaryScore =
            document.getElementById("summaryScore");

        const summaryMessage =
            document.getElementById("summaryMessage");


        // AI SCORE

        if (score) {

            score.textContent =
                savedEvaluation.overall + "/100";

        }


        // SUMMARY SCORE

        if (summaryScore) {

            summaryScore.textContent =
                savedEvaluation.overall;

        }


        // MESSAGE

        if (summaryMessage) {

            summaryMessage.textContent =

                savedEvaluation.startupName +
                " received an AI evaluation score of " +
                savedEvaluation.overall +
                "/100.";

        }

    }

});