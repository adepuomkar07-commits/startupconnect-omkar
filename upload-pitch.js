document.getElementById("pitchForm").addEventListener("submit", function (e) {

    e.preventDefault();

    let startup = document.getElementById("startupName").value;

    let file = document.getElementById("pitchFile").files[0];

    if (startup == "") {

        alert("Enter Startup Name");

        return;

    }

    if (!file) {

        alert("Please Select a Pitch Deck");

        return;

    }

    localStorage.setItem("pitchDeckName", file.name);

    document.getElementById("successBox").style.display = "block";

    document.getElementById("successBox").innerHTML =

        "✅ " + file.name + " uploaded successfully!";

});