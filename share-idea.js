// =========================================================
// STARTUPCONNECT — MY IDEAS JAVASCRIPT
// =========================================================


// =========================================================
// 1. LOGIN PROTECTION
// =========================================================

const loggedIn = localStorage.getItem("loggedIn");

if (loggedIn !== "true") {

    alert("⚠️ Please login to access My Ideas.");

    window.location.href = "login.html";

}


// =========================================================
// 2. GET FOUNDER INFORMATION
// =========================================================

const founderName =
    localStorage.getItem("founderName") || "Founder";


// =========================================================
// 3. DOM ELEMENTS
// =========================================================

const ideaEditor =
    document.getElementById("ideaEditor");

const ideaForm =
    document.getElementById("ideaForm");

const newIdeaBtn =
    document.getElementById("newIdeaBtn");

const emptyNewIdeaBtn =
    document.getElementById("emptyNewIdeaBtn");

const closeEditorBtn =
    document.getElementById("closeEditorBtn");

const cancelIdeaBtn =
    document.getElementById("cancelIdeaBtn");

const ideasContainer =
    document.getElementById("ideasContainer");

const emptyState =
    document.getElementById("emptyState");

const ideaCount =
    document.getElementById("ideaCount");

const founderNameElement =
    document.getElementById("founderName");

const userAvatar =
    document.getElementById("userAvatar");


// =========================================================
// 4. FOUNDER NAME
// =========================================================

if (founderNameElement) {

    founderNameElement.textContent =
        founderName;

}


if (userAvatar) {

    userAvatar.textContent =
        founderName
            .charAt(0)
            .toUpperCase();

}


// =========================================================
// 5. FORM INPUTS
// =========================================================

const ideaTitle =
    document.getElementById("ideaTitle");

const ideaCategory =
    document.getElementById("ideaCategory");

const ideaStage =
    document.getElementById("ideaStage");

const ideaDescription =
    document.getElementById("ideaDescription");

const ideaProblem =
    document.getElementById("ideaProblem");

const ideaSolution =
    document.getElementById("ideaSolution");

const targetCustomers =
    document.getElementById("targetCustomers");

const businessModel =
    document.getElementById("businessModel");

const marketOpportunity =
    document.getElementById("marketOpportunity");

const competitiveAdvantage =
    document.getElementById("competitiveAdvantage");


// =========================================================
// 6. COUNTERS
// =========================================================

const titleCount =
    document.getElementById("titleCount");

const descriptionCount =
    document.getElementById("descriptionCount");


// =========================================================
// 7. CURRENT EDITING ID
// =========================================================

let editingIdeaId = null;


// =========================================================
// 8. GET SAVED IDEAS
// =========================================================

function getIdeas() {

    const savedIdeas =
        localStorage.getItem("startupIdeas");


    if (!savedIdeas) {

        return [];

    }


    try {

        return JSON.parse(savedIdeas);

    }

    catch (error) {

        console.error(
            "Unable to load ideas:",
            error
        );

        return [];

    }

}


// =========================================================
// 9. SAVE IDEAS TO LOCAL STORAGE
// =========================================================

function saveIdeas(ideas) {

    localStorage.setItem(
        "startupIdeas",
        JSON.stringify(ideas)
    );

}


// =========================================================
// 10. OPEN IDEA EDITOR
// =========================================================

function openEditor() {

    if (!ideaEditor) {

        return;

    }


    ideaEditor.classList.add("show");


    setTimeout(
        function () {

            if (ideaTitle) {

                ideaTitle.focus();

            }

        },
        100
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// =========================================================
// 11. CLOSE IDEA EDITOR
// =========================================================

function closeEditor() {

    if (!ideaEditor) {

        return;

    }


    ideaEditor.classList.remove("show");


    resetForm();

}


// =========================================================
// 12. NEW IDEA BUTTON
// =========================================================

if (newIdeaBtn) {

    newIdeaBtn.addEventListener(
        "click",
        function () {

            editingIdeaId = null;

            resetForm();

            openEditor();

        }
    );

}


// =========================================================
// 13. EMPTY STATE BUTTON
// =========================================================

if (emptyNewIdeaBtn) {

    emptyNewIdeaBtn.addEventListener(
        "click",
        function () {

            editingIdeaId = null;

            resetForm();

            openEditor();

        }
    );

}


// =========================================================
// 14. CLOSE BUTTON
// =========================================================

if (closeEditorBtn) {

    closeEditorBtn.addEventListener(
        "click",
        function () {

            closeEditor();

        }
    );

}


// =========================================================
// 15. CANCEL BUTTON
// =========================================================

if (cancelIdeaBtn) {

    cancelIdeaBtn.addEventListener(
        "click",
        function () {

            closeEditor();

        }
    );

}


// =========================================================
// 16. TITLE CHARACTER COUNTER
// =========================================================

if (ideaTitle && titleCount) {

    ideaTitle.addEventListener(
        "input",
        function () {

            titleCount.textContent =
                ideaTitle.value.length +
                " / 100";

        }
    );

}


// =========================================================
// 17. DESCRIPTION CHARACTER COUNTER
// =========================================================

if (
    ideaDescription &&
    descriptionCount
) {

    ideaDescription.addEventListener(
        "input",
        function () {

            descriptionCount.textContent =
                ideaDescription.value.length +
                " / 1200";

        }
    );

}


// =========================================================
// 18. CREATE IDEA OBJECT
// =========================================================

function createIdeaObject() {

    return {

        id:
            editingIdeaId ||
            Date.now().toString(),

        title:
            ideaTitle.value.trim(),

        category:
            ideaCategory.value,

        stage:
            ideaStage.value,

        description:
            ideaDescription.value.trim(),

        problem:
            ideaProblem.value.trim(),

        solution:
            ideaSolution.value.trim(),

        targetCustomers:
            targetCustomers.value.trim(),

        businessModel:
            businessModel.value,

        marketOpportunity:
            marketOpportunity.value.trim(),

        competitiveAdvantage:
            competitiveAdvantage.value.trim(),

        founder:
            founderName,

        createdAt:
            new Date().toISOString()

    };

}


// =========================================================
// 19. FORM SUBMIT
// =========================================================

if (ideaForm) {

    ideaForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            // Required fields

            if (
                ideaTitle.value.trim() === "" ||
                ideaCategory.value === "" ||
                ideaStage.value === "" ||
                ideaDescription.value.trim() === "" ||
                ideaProblem.value.trim() === "" ||
                ideaSolution.value.trim() === "" ||
                targetCustomers.value.trim() === ""
            ) {

                showMessage(
                    "⚠️ Please complete all required fields.",
                    "error"
                );

                return;

            }


            // Create object

            const idea =
                createIdeaObject();


            // Get existing ideas

            let ideas =
                getIdeas();


            // EDIT EXISTING IDEA

            if (editingIdeaId) {

                ideas =
                    ideas.map(
                        function (item) {

                            if (
                                item.id ===
                                editingIdeaId
                            ) {

                                return idea;

                            }

                            return item;

                        }
                    );


                showMessage(
                    "✅ Idea updated successfully!",
                    "success"
                );

            }

            // CREATE NEW IDEA

            else {

                ideas.unshift(idea);


                showMessage(
                    "🚀 Idea saved successfully!",
                    "success"
                );

            }


            // Save

            saveIdeas(ideas);


            // Refresh cards

            renderIdeas();


            // Reset

            editingIdeaId = null;

            resetForm();


            // Close editor

            setTimeout(
                function () {

                    closeEditor();

                },
                500
            );

        }
    );

}


// =========================================================
// 20. RENDER ALL IDEAS
// =========================================================

function renderIdeas() {

    if (!ideasContainer) {

        return;

    }


    const ideas =
        getIdeas();


    // Update count

    if (ideaCount) {

        ideaCount.textContent =
            ideas.length +
            (
                ideas.length === 1
                    ? " Idea"
                    : " Ideas"
            );

    }


    // Remove old cards

    const existingCards =
        ideasContainer.querySelectorAll(
            ".idea-card"
        );


    existingCards.forEach(
        function (card) {

            card.remove();

        }
    );


    // Show empty state

    if (ideas.length === 0) {

        if (emptyState) {

            emptyState.style.display =
                "flex";

        }

        return;

    }


    // Hide empty state

    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    // Create cards

    ideas.forEach(
        function (idea) {

            const card =
                createIdeaCard(idea);


            ideasContainer.appendChild(
                card
            );

        }
    );

}


// =========================================================
// 21. CREATE IDEA CARD
// =========================================================

function createIdeaCard(idea) {

    const card =
        document.createElement("article");


    card.className =
        "idea-card";


    const formattedDate =
        formatDate(idea.createdAt);


    card.innerHTML = `

        <div class="idea-card-header">

            <div class="idea-card-icon">

                <i class="fa-solid fa-lightbulb"></i>

            </div>


            <div class="idea-card-actions">

                <button
                    class="idea-action edit"
                    data-id="${idea.id}"
                    title="Edit Idea">

                    <i class="fa-solid fa-pen"></i>

                </button>


                <button
                    class="idea-action delete"
                    data-id="${idea.id}"
                    title="Delete Idea">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        </div>


        <h3>
            ${escapeHTML(idea.title)}
        </h3>


        <p class="idea-card-description">

            ${escapeHTML(idea.description)}

        </p>


        <div class="idea-tags">

            <span class="idea-tag primary">

                ${escapeHTML(idea.category)}

            </span>


            <span class="idea-tag">

                ${escapeHTML(idea.stage)}

            </span>

        </div>


        <div class="idea-card-footer">

            <span>

                <i class="fa-regular fa-calendar"></i>

                ${formattedDate}

            </span>


            <span>

                <i class="fa-solid fa-user"></i>

                ${escapeHTML(idea.founder)}

            </span>

        </div>

    `;


    // EDIT BUTTON

    const editButton =
        card.querySelector(".edit");


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                editIdea(idea.id);

            }
        );

    }


    // DELETE BUTTON

    const deleteButton =
        card.querySelector(".delete");


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function () {

                deleteIdea(idea.id);

            }
        );

    }


    return card;

}


// =========================================================
// 22. EDIT IDEA
// =========================================================

function editIdea(id) {

    const ideas =
        getIdeas();


    const idea =
        ideas.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!idea) {

        return;

    }


    editingIdeaId =
        id;


    // Fill form

    ideaTitle.value =
        idea.title || "";

    ideaCategory.value =
        idea.category || "";

    ideaStage.value =
        idea.stage || "";

    ideaDescription.value =
        idea.description || "";

    ideaProblem.value =
        idea.problem || "";

    ideaSolution.value =
        idea.solution || "";

    targetCustomers.value =
        idea.targetCustomers || "";

    businessModel.value =
        idea.businessModel || "";

    marketOpportunity.value =
        idea.marketOpportunity || "";

    competitiveAdvantage.value =
        idea.competitiveAdvantage || "";


    // Update counters

    if (titleCount) {

        titleCount.textContent =
            ideaTitle.value.length +
            " / 100";

    }


    if (descriptionCount) {

        descriptionCount.textContent =
            ideaDescription.value.length +
            " / 1200";

    }


    // Change save button text

    const saveButton =
        document.getElementById(
            "saveIdeaBtn"
        );


    if (saveButton) {

        saveButton.innerHTML = `

            <i class="fa-solid fa-pen"></i>

            Update Idea

        `;

    }


    openEditor();

}


// =========================================================
// 23. DELETE IDEA
// =========================================================

function deleteIdea(id) {

    const ideas =
        getIdeas();


    const idea =
        ideas.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!idea) {

        return;

    }


    const confirmed =
        confirm(
            `Delete "${idea.title}"?`
        );


    if (!confirmed) {

        return;

    }


    const updatedIdeas =
        ideas.filter(
            function (item) {

                return item.id !== id;

            }
        );


    saveIdeas(
        updatedIdeas
    );


    renderIdeas();


    showMessage(
        "🗑️ Idea deleted.",
        "success"
    );

}


// =========================================================
// 24. RESET FORM
// =========================================================

function resetForm() {

    if (ideaForm) {

        ideaForm.reset();

    }


    editingIdeaId = null;


    if (titleCount) {

        titleCount.textContent =
            "0 / 100";

    }


    if (descriptionCount) {

        descriptionCount.textContent =
            "0 / 1200";

    }


    const saveButton =
        document.getElementById(
            "saveIdeaBtn"
        );


    if (saveButton) {

        saveButton.innerHTML = `

            <i class="fa-solid fa-floppy-disk"></i>

            Save Idea

        `;

    }

}


// =========================================================
// 25. FORMAT DATE
// =========================================================

function formatDate(dateString) {

    if (!dateString) {

        return "Recently";

    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {

        return "Recently";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =========================================================
// 26. PROTECT HTML OUTPUT
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value || "";


    return div.innerHTML;

}


// =========================================================
// 27. SUCCESS / ERROR MESSAGE
// =========================================================

function showMessage(
    message,
    type = "success"
) {

    const oldMessage =
        document.querySelector(
            ".success-message"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    const messageBox =
        document.createElement("div");


    messageBox.className =
        "success-message";


    if (type === "error") {

        messageBox.style.color =
            "#dc2626";

        messageBox.style.borderColor =
            "#fecaca";

    }


    messageBox.innerHTML = `

        <span>${message}</span>

    `;


    document.body.appendChild(
        messageBox
    );


    setTimeout(
        function () {

            messageBox.remove();

        },
        3000
    );

}


// =========================================================
// 28. MOBILE MENU
// =========================================================

const menuBtn =
    document.getElementById("menuBtn");


const sidebar =
    document.querySelector(".sidebar");


if (menuBtn && sidebar) {

    menuBtn.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "show"
            );

        }
    );

}


// =========================================================
// 29. CLOSE MOBILE MENU AFTER CLICK
// =========================================================

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );


navLinks.forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                if (
                    window.innerWidth <= 900 &&
                    sidebar
                ) {

                    sidebar.classList.remove(
                        "show"
                    );

                }

            }
        );

    }
);


// =========================================================
// 30. NOTIFICATIONS
// =========================================================

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );


if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        function () {

            alert(
                "🔔 You have 3 new notifications."
            );

        }
    );

}


// =========================================================
// 31. LOGOUT
// =========================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {

                return;

            }


            localStorage.removeItem(
                "loggedIn"
            );


            window.location.href =
                "login.html";

        }
    );

}


// =========================================================
// 32. INITIALIZE PAGE
// =========================================================

renderIdeas();


console.log(
    "🚀 StartupConnect — My Ideas loaded successfully."
);