// Display selected investor
document.getElementById("investor").value =
    localStorage.getItem("selectedInvestor") || "No Investor Selected";

// Book Meeting
document.getElementById("meetingForm").addEventListener("submit", function (e) {

    e.preventDefault();

    const meeting = {

        investor: document.getElementById("investor").value,

        date: document.getElementById("meetingDate").value,

        time: document.getElementById("meetingTime").value,

        mode: document.getElementById("meetingMode").value,

        purpose: document.getElementById("purpose").value,

        status: "Pending"

    };

    localStorage.setItem("meeting", JSON.stringify(meeting));

    const box = document.getElementById("successBox");

    box.style.display = "block";

    box.innerHTML = "✅ Meeting booked successfully!";

});