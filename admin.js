// Founder Details

document.getElementById("founderName").innerHTML =
    localStorage.getItem("founderName") || "-";

document.getElementById("startupName").innerHTML =
    localStorage.getItem("startupName") || "-";

document.getElementById("email").innerHTML =
    localStorage.getItem("email") || "-";

document.getElementById("funding").innerHTML =
    "$" + (localStorage.getItem("raisedAmount") || "0");

// Startup Idea

let idea = JSON.parse(localStorage.getItem("startupIdea"));

if (idea) {

    document.getElementById("ideaTitle").innerHTML = idea.title;
    document.getElementById("ideaDomain").innerHTML = idea.domain;
    document.getElementById("ideaDescription").innerHTML = idea.description;
    document.getElementById("ideaProblem").innerHTML = idea.problem;
    document.getElementById("ideaSolution").innerHTML = idea.solution;

}

// Meeting

let meeting = JSON.parse(localStorage.getItem("meeting"));

if (meeting) {

    document.getElementById("investor").innerHTML = meeting.investor;
    document.getElementById("meetingDate").innerHTML = meeting.date;
    document.getElementById("meetingTime").innerHTML = meeting.time;
    document.getElementById("meetingStatus").innerHTML = meeting.status;

}

function logout() {

    alert("Admin Logged Out");

    window.location.href = "index.html";

}