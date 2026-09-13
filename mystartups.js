let startups = [];
let editingStartupId = null;



// ======================================================
// SESSION PROTECTION
// ======================================================

function checkSession() {

    const token = localStorage.getItem("startupconnect_token");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}



// ======================================================
// HANDLE UNAUTHORIZED SESSION
// ======================================================

function handleUnauthorized(message = "Your session has expired. Please login again.") {

    console.warn("Unauthorized:", message);

    localStorage.removeItem("startupconnect_token");
    localStorage.removeItem("startupconnect_user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("selectedStartup");
    localStorage.removeItem("latestEvaluation");
    localStorage.removeItem("latestEvaluationId");
    localStorage.removeItem("latestEvaluationStartupId");

    window.location.href = "login.html";
}



// ======================================================
// DOM READY
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Protect page immediately
    if (!checkSession()) {
        return;
    }

    const addStartupBtn =
        document.getElementById("addStartupBtn");

    const closeModalBtn =
        document.getElementById("closeModalBtn");

    const cancelModalBtn =
        document.getElementById("cancelModalBtn");

    const startupForm =
        document.getElementById("startupForm");

    const startupModal =
        document.getElementById("startupModal");

    const startupGrid =
        document.getElementById("startupGrid");



    // ==================================================
    // BUTTON EVENTS
    // ==================================================

    if (addStartupBtn) {

        addStartupBtn.addEventListener("click", () => {
            openAddModal();
        });

    }



    if (closeModalBtn) {

        closeModalBtn.addEventListener("click", () => {
            closeModal();
        });

    }



    if (cancelModalBtn) {

        cancelModalBtn.addEventListener("click", () => {
            closeModal();
        });

    }



    if (startupForm) {

        startupForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await saveStartup();
        });

    }



    // Close modal when clicking outside
    if (startupModal) {

        startupModal.addEventListener("click", (event) => {

            if (event.target === startupModal) {
                closeModal();
            }

        });

    }



    // ==================================================
    // LOAD STARTUPS
    // ==================================================

    loadStartups();

});



// ======================================================
// LOAD STARTUPS FROM MONGODB
// ======================================================

async function loadStartups() {

    if (!checkSession()) {
        return;
    }

    const token =
        localStorage.getItem("startupconnect_token");

    const startupGrid =
        document.getElementById("startupGrid");

    if (!startupGrid) {
        return;
    }



    startupGrid.innerHTML = `
        <div class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading your startups...</p>
        </div>
    `;



    try {

        const response = await fetch(
            `${API_URL}/api/startups`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );



        // ==============================================
        // SESSION EXPIRED
        // ==============================================

        if (response.status === 401) {

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                console.warn("Could not read 401 response.");
            }

            handleUnauthorized(
                data.message || "Invalid or expired token"
            );

            return;
        }



        const data = await response.json();



        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Failed to load startups"
            );

        }



        startups = data.startups || [];

        displayStartups();



    } catch (error) {

        console.error(
            "LOAD STARTUPS ERROR:",
            error
        );



        startupGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <h2>Unable to load startups</h2>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Something went wrong while loading your startups."
                    )}
                </p>
            </div>
        `;

    }

}



// ======================================================
// DISPLAY STARTUPS
// ======================================================

function displayStartups() {

    const startupGrid =
        document.getElementById("startupGrid");

    if (!startupGrid) {
        return;
    }



    if (!startups.length) {

        startupGrid.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-rocket"></i>

                <h2>No Startups Yet</h2>

                <p>
                    Add your first startup idea and start building
                    your journey with StartupConnect.
                </p>

            </div>
        `;

        return;
    }



    startupGrid.innerHTML = startups.map(startup => {

        return `
            <div class="startup-card">

                <div class="startup-icon">
                    <i class="fa-solid fa-rocket"></i>
                </div>

                <h3>
                    ${escapeHTML(startup.name)}
                </h3>

                <span class="industry">
                    ${escapeHTML(startup.industry)}
                </span>

                <p class="startup-description">
                    ${escapeHTML(startup.description)}
                </p>

                <div class="startup-actions">

                    <button
                        class="select-btn"
                        onclick="selectStartup('${startup._id}')">

                        <i class="fa-solid fa-check"></i>
                        Select

                    </button>



                    <button
                        class="edit-btn"
                        onclick="openEditModal('${startup._id}')">

                        <i class="fa-solid fa-pen"></i>
                        Edit

                    </button>



                    <button
                        class="delete-btn"
                        onclick="deleteStartup('${startup._id}')">

                        <i class="fa-solid fa-trash"></i>
                        Delete

                    </button>



                    <button
                        class="ai-btn"
                        onclick="openAI('${startup._id}')">

                        <i class="fa-solid fa-robot"></i>
                        AI Evaluation

                    </button>

                </div>

            </div>
        `;

    }).join("");

}



// ======================================================
// OPEN ADD MODAL
// ======================================================

function openAddModal() {

    editingStartupId = null;



    const modal =
        document.getElementById("startupModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const startupForm =
        document.getElementById("startupForm");

    const startupId =
        document.getElementById("startupId");

    const saveButton =
        document.getElementById("saveStartupBtn");



    if (!modal || !startupForm) {
        return;
    }



    modalTitle.textContent = "Add New Startup";

    startupForm.reset();

    startupId.value = "";

    saveButton.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Save Startup
    `;



    modal.classList.add("show");

}



// ======================================================
// OPEN EDIT MODAL
// ======================================================

function openEditModal(id) {

    const startup =
        startups.find(item => item._id === id);

    if (!startup) {
        showToast(
            "Startup not found.",
            "error"
        );

        return;
    }



    editingStartupId = id;



    const modal =
        document.getElementById("startupModal");

    const modalTitle =
        document.getElementById("modalTitle");

    const startupId =
        document.getElementById("startupId");

    const startupName =
        document.getElementById("startupName");

    const startupIndustry =
        document.getElementById("startupIndustry");

    const startupDescription =
        document.getElementById("startupDescription");

    const saveButton =
        document.getElementById("saveStartupBtn");



    modalTitle.textContent = "Edit Startup";

    startupId.value = startup._id;

    startupName.value = startup.name || "";

    startupIndustry.value = startup.industry || "";

    startupDescription.value =
        startup.description || "";



    saveButton.innerHTML = `
        <i class="fa-solid fa-floppy-disk"></i>
        Update Startup
    `;



    modal.classList.add("show");

}



// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    const modal =
        document.getElementById("startupModal");

    const startupForm =
        document.getElementById("startupForm");

    editingStartupId = null;



    if (startupForm) {
        startupForm.reset();
    }



    if (modal) {
        modal.classList.remove("show");
    }

}



// ======================================================
// SAVE / UPDATE STARTUP
// ======================================================

async function saveStartup() {

    if (!checkSession()) {
        return;
    }



    const token =
        localStorage.getItem("startupconnect_token");



    const startupName =
        document.getElementById("startupName").value.trim();

    const startupIndustry =
        document.getElementById("startupIndustry").value.trim();

    const startupDescription =
        document.getElementById("startupDescription").value.trim();



    if (
        !startupName ||
        !startupIndustry ||
        !startupDescription
    ) {

        showToast(
            "Please fill in all fields.",
            "error"
        );

        return;
    }



    const saveButton =
        document.getElementById("saveStartupBtn");



    saveButton.disabled = true;

    saveButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Saving...
    `;



    try {

        const isEditing =
            Boolean(editingStartupId);



        const url = isEditing
            ? `${API_URL}/api/startups/${editingStartupId}`
            : `${API_URL}/api/startups`;



        const method =
            isEditing ? "PUT" : "POST";



        const response = await fetch(
            url,
            {
                method: method,

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({

                    name: startupName,

                    industry: startupIndustry,

                    description: startupDescription

                })
            }
        );



        // ==============================================
        // SESSION EXPIRED
        // ==============================================

        if (response.status === 401) {

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                console.warn("Could not read 401 response.");
            }

            handleUnauthorized(
                data.message || "Invalid or expired token"
            );

            return;
        }



        const data =
            await response.json();



        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to save startup"
            );

        }



        showToast(
            isEditing
                ? "Startup updated successfully!"
                : "Startup added successfully!",
            "success"
        );



        closeModal();

        await loadStartups();



    } catch (error) {

        console.error(
            "SAVE STARTUP ERROR:",
            error
        );



        showToast(
            error.message ||
            "Unable to save startup.",
            "error"
        );



    } finally {

        saveButton.disabled = false;

        saveButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            ${editingStartupId
                ? "Update Startup"
                : "Save Startup"}
        `;

    }

}



// ======================================================
// SELECT STARTUP
// ======================================================

function selectStartup(id) {

    const startup =
        startups.find(item => item._id === id);



    if (!startup) {

        showToast(
            "Startup not found.",
            "error"
        );

        return;
    }



    localStorage.setItem(
        "selectedStartup",
        JSON.stringify(startup)
    );



    showToast(
        `${startup.name} selected successfully!`,
        "success"
    );

}



// ======================================================
// OPEN AI EVALUATION
// ======================================================

function openAI(id) {

    const startup =
        startups.find(item => item._id === id);



    if (!startup) {

        showToast(
            "Startup not found.",
            "error"
        );

        return;
    }



    localStorage.setItem(
        "selectedStartup",
        JSON.stringify(startup)
    );



    window.location.href =
        "evaluation.html";

}



// ======================================================
// DELETE STARTUP
// ======================================================

async function deleteStartup(id) {

    if (!checkSession()) {
        return;
    }



    const startup =
        startups.find(item => item._id === id);



    if (!startup) {
        return;
    }



    const confirmed =
        confirm(
            `Are you sure you want to delete "${startup.name}"?`
        );



    if (!confirmed) {
        return;
    }



    const token =
        localStorage.getItem("startupconnect_token");



    try {

        const response = await fetch(
            `${API_URL}/api/startups/${id}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );



        // ==============================================
        // SESSION EXPIRED
        // ==============================================

        if (response.status === 401) {

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                console.warn("Could not read 401 response.");
            }

            handleUnauthorized(
                data.message || "Invalid or expired token"
            );

            return;
        }



        const data =
            await response.json();



        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete startup"
            );

        }



        // Remove selected startup if it was deleted
        const selectedStartup =
            localStorage.getItem("selectedStartup");



        if (selectedStartup) {

            try {

                const selected =
                    JSON.parse(selectedStartup);

                if (selected._id === id) {

                    localStorage.removeItem(
                        "selectedStartup"
                    );

                }

            } catch (error) {

                localStorage.removeItem(
                    "selectedStartup"
                );

            }

        }



        showToast(
            "Startup deleted successfully!",
            "success"
        );



        await loadStartups();



    } catch (error) {

        console.error(
            "DELETE STARTUP ERROR:",
            error
        );



        showToast(
            error.message ||
            "Unable to delete startup.",
            "error"
        );

    }

}



// ======================================================
// TOAST
// ======================================================

function showToast(message, type = "success") {

    const toast =
        document.getElementById("toast");



    if (!toast) {
        return;
    }



    toast.textContent = message;

    toast.className =
        `toast ${type} show`;



    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}



// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}