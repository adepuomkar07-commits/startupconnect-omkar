let goal = 100000;
let raised = 0;

function addFunding() {

    let amount =
        Number(document.getElementById("amount").value);

    if (amount <= 0) {

        alert("Enter a valid amount.");

        return;

    }

    raised += amount;

    if (raised > goal) {

        raised = goal;

    }

    let percentage = (raised / goal) * 100;

    document.getElementById("progressBar").style.width =
        percentage + "%";

    document.getElementById("progressText").innerHTML =
        "$" + raised + " Raised of $" + goal + " Goal";

    let li = document.createElement("li");

    li.innerHTML = "$" + amount + " invested";

    document.getElementById("historyList").appendChild(li);

    document.getElementById("amount").value = "";

    localStorage.setItem("raisedAmount", raised);

}