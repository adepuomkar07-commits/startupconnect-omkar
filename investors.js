function requestMeeting(name) {

    localStorage.setItem("selectedInvestor", name);

    window.location.href = "meetings.html";

}