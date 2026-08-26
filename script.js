/* ============================================================
   ENTWICKLUNGSKOMPASS
   KINDERGARTEN-VERWALTUNG
   ============================================================ */

"use strict";
console.log(
    "AKTUELLE SCRIPT-VERSION GELADEN: user_id-fix-2026-08-26"
);


/* ============================================================
   SUPABASE
   ============================================================ */

const SUPABASE_URL =
    "https://sjekwvalxujnfparxees.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWt3dmFseHVqbmZwYXJ4ZWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDU5NDQsImV4cCI6MjEwMzA4MTk0NH0.xMCPzUE7BHJpYYduKoRPQ-LC6UAJJzcJWsFhik-2oZ8";


if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {
    console.error("Supabase JS wurde nicht geladen.");
}
else {
    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );
}


let supabaseClient =
    window.supabaseClient || null;

let currentUser = null;
let currentProfile = null;

let currentChildren = [];
let currentGroups = [];

let currentQuestions = [];
let currentAnswers = {};

let currentAge = null;
let currentChildId = null;


/* ============================================================
   HILFSFUNKTIONEN
   ============================================================ */

/* ============================================================
   ALTER EINES KINDES BERECHNEN
   ============================================================ */

function calculateChildAge(birthDate) {

    if (!birthDate) {
        return null;
    }

    const birth = new Date(
        birthDate + "T00:00:00"
    );

    const today = new Date();

    if (Number.isNaN(birth.getTime())) {
        return null;
    }

    let years =
        today.getFullYear() -
        birth.getFullYear();

    let months =
        today.getMonth() -
        birth.getMonth();

    let days =
        today.getDate() -
        birth.getDate();


    if (days < 0) {

        months--;

    }


    if (months < 0) {

        years--;
        months += 12;

    }


    return {
        years,
        months
    };

}


/* ============================================================
   ALTER ALS TEXT
   ============================================================ */

function formatChildAge(birthDate) {

    const age =
        calculateChildAge(birthDate);

    if (!age) {

        return "Alter unbekannt";

    }


    if (
        age.years === 0 &&
        age.months === 0
    ) {

        return "unter 1 Jahr";

    }


    if (age.years === 0) {

        return `${age.months} Monate`;

    }


    if (age.months === 0) {

        return age.years === 1
            ? "1 Jahr"
            : `${age.years} Jahre`;

    }


    const yearText =
        age.years === 1
            ? "1 Jahr"
            : `${age.years} Jahre`;

    const monthText =
        age.months === 1
            ? "1 Monat"
            : `${age.months} Monate`;


    return `${yearText}, ${monthText}`;

}

/* ============================================================
   GEBURTSDATUM – ALTER LIVE ANZEIGEN
   ============================================================ */

function setupChildBirthDate() {

    const birthDateInput =
        document.getElementById(
            "newChildBirthDate"
        );

    const ageDisplay =
        document.getElementById(
            "newChildAgeDisplay"
        );


    if (
        !birthDateInput ||
        !ageDisplay
    ) {

        return;

    }


    birthDateInput.addEventListener(
        "change",
        function () {

            const birthDate =
                birthDateInput.value;


            if (!birthDate) {

                ageDisplay.textContent =
                    "Bitte zuerst das Geburtsdatum eingeben.";

                return;

            }


            ageDisplay.textContent =
                formatChildAge(
                    birthDate
                );

        }
    );

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function byId(id) {
    return document.getElementById(id);
}

function safeText(element, text) {
    if (element) {
        element.textContent = text ?? "";
    }
}

/* ============================================================
   DOM
   ============================================================ */

const loginSection =
    byId("loginSection");

const registerSection =
    byId("registerSection");

const appSection =
    byId("appSection");


/* ============================================================
   LOGIN / APP
   ============================================================ */

function showLogin() {

    if (loginSection) {
        loginSection.style.display = "";
    }

    if (registerSection) {
        registerSection.style.display = "none";
    }

    if (appSection) {
        appSection.style.display = "none";
    }

}


function showDashboard() {

    if (loginSection) {
        loginSection.style.display = "none";
    }

    if (registerSection) {
        registerSection.style.display = "none";
    }

    if (appSection) {

        appSection.style.display = "";

        appSection.classList.remove("hidden");

    }

}


/* ============================================================
   PROFIL
   ============================================================ */

async function loadUserProfile() {

    if (!supabaseClient) {
        return null;
    }

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabaseClient.auth.getUser();


        if (userError) {

            console.error(
                "Auth-Benutzer konnte nicht geladen werden:",
                userError
            );

            currentProfile = null;

            return null;

        }


        if (!user) {

            currentProfile = null;

            return null;

        }


        currentUser = user;


        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    institution_id,
                    full_name,
                    phone,
                    role,
                    created_at,
                    approval_status,
                    approved_by,
                    approved_at
                `)
                .eq("id", user.id)
                .maybeSingle();


        if (error) {

            console.error(
                "Profil konnte nicht geladen werden:",
                error
            );

            currentProfile = {

                id: user.id,

                institution_id: null,

                full_name:
                    user.email || "Benutzer",

                phone: "",

                role: "ADMIN",

                email:
                    user.email || ""

            };

        }

        else if (data) {

            currentProfile = {

                ...data,

                email:
                    user.email || ""

            };

        }

        else {

            currentProfile = {

                id: user.id,

                institution_id: null,

                full_name:
                    user.email || "Benutzer",

                phone: "",

                role: "ADMIN",

                email:
                    user.email || ""

            };

        }


        updateUserUI();

        return currentProfile;

    }

    catch (error) {

        console.error(
            "Fehler in loadUserProfile():",
            error
        );

        currentProfile = null;

        return null;

    }

}


/* ============================================================
   BENUTZER UI
   ============================================================ */

function updateUserUI() {

    if (!currentUser) {

        showLogin();

        return;

    }


    showDashboard();


    const emailElement =
        byId("userEmail");

    const nameElement =
        byId("userName");

    const profileName =
        byId("profileName");

    const profileEmail =
        byId("profileEmail");

    const profileRole =
        byId("profileRole");

    const institutionName =
        byId("institutionName");


    const displayName =
        currentProfile?.full_name ||
        currentUser.email ||
        "Benutzer";


    safeText(
        emailElement,
        currentUser.email || ""
    );

    safeText(
        nameElement,
        displayName
    );

    safeText(
        profileName,
        displayName
    );

    safeText(
        profileEmail,
        currentUser.email || ""
    );

    safeText(
        profileRole,
        currentProfile?.role || "—"
    );

    safeText(
        institutionName,
        displayName
    );


    updateRoleUI();

}


function updateRoleUI() {

    const role =
        currentProfile?.role || "";


    document
        .querySelectorAll("[data-role]")
        .forEach(element => {

            const requiredRole =
                element.dataset.role;

            element.style.display =
                requiredRole === role
                    ? ""
                    : "none";

        });

}


function canManageChildren() {

    const role =
        currentProfile?.role;

    return (
        role === "ADMIN" ||
        role === "ERZIEHER"
    );

}


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

    if (!supabaseClient) {
        return;
    }


    try {

        await supabaseClient.auth.signOut();

    }

    catch (error) {

        console.error(
            "Logout fehlgeschlagen:",
            error
        );

    }


    currentUser = null;
    currentProfile = null;

    currentChildren = [];
    currentGroups = [];

    currentQuestions = [];
    currentAnswers = {};

    currentAge = null;
    currentChildId = null;

    showLogin();

}


/* ============================================================
   LOGIN
   ============================================================ */

async function handleLogin(event) {

    event.preventDefault();


    if (!supabaseClient) {
        return;
    }


    const emailInput =
        byId("loginEmail");

    const passwordInput =
        byId("loginPassword");

    const message =
        byId("loginMessage");


    const email =
        emailInput?.value?.trim() || "";

    const password =
        passwordInput?.value || "";


    if (!email || !password) {

        safeText(
            message,
            "Bitte E-Mail und Passwort eingeben."
        );

        return;

    }


    safeText(
        message,
        "Anmeldung läuft..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({

                email,
                password

            });


    if (error) {

        console.error(
            "Login fehlgeschlagen:",
            error
        );

        safeText(
            message,
            error.message
        );

        return;

    }


    currentUser =
        data.user;


    await loadUserProfile();


    safeText(
        message,
        ""
    );


    showDashboard();


    await initializeApplication();

}


/* ============================================================
   REGISTRIERUNG
   ============================================================ */

async function handleRegister(event) {

    event.preventDefault();


    if (!supabaseClient) {
        return;
    }


    const email =
        byId("registerEmail")
            ?.value
            ?.trim() || "";

    const password =
        byId("registerPassword")
            ?.value || "";

    const firstName =
        byId("registerFirstName")
            ?.value
            ?.trim() || "";

    const lastName =
        byId("registerLastName")
            ?.value
            ?.trim() || "";

    const message =
        byId("registerMessage");


    if (!email || !password) {

        safeText(
            message,
            "Bitte E-Mail und Passwort eingeben."
        );

        return;

    }


    const fullName =
        `${firstName} ${lastName}`.trim();


    safeText(
        message,
        "Registrierung läuft..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({

            email,

            password,

            options: {

                data: {

                    full_name:
                        fullName

                }

            }

        });


    if (error) {

        console.error(
            "Registrierung fehlgeschlagen:",
            error
        );

        safeText(
            message,
            error.message
        );

        return;

    }


    safeText(
        message,
        "Registrierung erfolgreich. Bitte überprüfe deine E-Mail."
    );


    if (data?.user) {
        currentUser = data.user;
    }

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    const navigationButtons =
        document.querySelectorAll(
            "[data-section]"
        );


    navigationButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const sectionName =
                        button.dataset.section;


                    if (!sectionName) {
                        return;
                    }


                    openSection(
                        sectionName
                    );


                   if (sectionName === "children") {
    await loadGroups();
    await loadChildren();
}

                    


                    if (
                        sectionName ===
                        "groups"
                    ) {

                        await loadGroups();

                    }


                    if (
                        sectionName ===
                        "development"
                    ) {

                        await openDevelopmentSection();

                    }


                    if (
                        sectionName ===
                        "dashboard"
                    ) {

                        await updateDashboardCounts();

                    }

                }
            );

        }
    );

}


function openSection(sectionName) {

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionName
            );

        });


    const sections =
        document.querySelectorAll(
            "[data-section-content]"
        );


    let found = false;


sections.forEach(section => {

    const matches =
        section.dataset.sectionContent ===
        sectionName;

    section.classList.toggle(
        "active",
        matches
    );

    if (matches) {
        found = true;
    }

});


    if (
        sectionName ===
        "development"
    ) {

        const development =
            ensureDevelopmentSection();


        if (development) {

            development.style.display =
                "";

            found = true;

        }

    }


    if (!found) {

        console.warn(
            "Section nicht gefunden:",
            sectionName
        );

    }

}


/* ============================================================
   KINDER
   ============================================================ */

async function loadChildren() {
    if (!supabaseClient || !currentUser) {
        return [];
    }

    const childrenList =
        byId("childrenList");

    if (childrenList) {
        childrenList.innerHTML =
            "<p>Kinder werden geladen...</p>";
    }

    let query = supabaseClient
        .from("children")
        .select(`
            id,
            child_code,
            birth_date,
            group_id,
            institution_id,
            created_at,
            Groups (
                id,
                group_name,
                institution_id
            )
        `)
        .order("child_code", {
            ascending: true
        });

    if (currentProfile?.institution_id) {
        query = query.eq(
            "institution_id",
            currentProfile.institution_id
        );
    }

    const {
        data,
        error
    } = await query;

    if (error) {
        console.error(
            "Kinder konnten nicht geladen werden:",
            error
        );

        if (childrenList) {
            childrenList.innerHTML = `
                <p style="color:red;">
                    Kinder konnten nicht geladen werden.<br>
                    ${escapeHtml(error.message)}
                </p>
            `;
        }

        return [];
    }

    currentChildren = data || [];

    renderChildrenList(
        currentChildren
    );

    updateChildrenCount(
        currentChildren.length
    );

    return currentChildren;
}


function renderChildrenList(children) {
    const childrenList = byId("childrenList");

    if (!childrenList) {
        return;
    }

    if (!children || children.length === 0) {
        childrenList.innerHTML = `
            <p>Noch keine Kinder angelegt.</p>
        `;
        return;
    }

    childrenList.innerHTML = "";

    children.forEach(child => {
        const item = document.createElement("div");

        item.className = "child-item";

        const groupName =
            child.Groups?.group_name || "Keine Gruppe";

        const birthDate =
            child.birth_date
                ? new Date(
                    `${child.birth_date}T00:00:00`
                ).toLocaleDateString("de-DE")
                : "Kein Geburtsdatum";

        item.innerHTML = `
            <div>
                <strong class="child-code">
                    ${escapeHtml(
                        child.child_code || "Keine Kinder-ID"
                    )}
                </strong>

                <br>

                <span>
                    Geburtsdatum:
                    ${escapeHtml(birthDate)}
                </span>

                <br>

                <span class="child-group">
                    Gruppe:
                    ${escapeHtml(groupName)}
                </span>
            </div>

            <div
                style="
                    display:flex;
                    gap:8px;
                    margin-top:12px;
                    flex-wrap:wrap;
                "
            >
                <button
                    type="button"
                    class="btn btn-secondary"
                    data-edit-child="${escapeHtml(child.id)}"
                >
                    Bearbeiten
                </button>

                <button
                    type="button"
                    class="btn btn-danger"
                    data-delete-child="${escapeHtml(child.id)}"
                >
                    Löschen
                </button>
            </div>
        `;

        childrenList.appendChild(item);
    });

    childrenList
        .querySelectorAll("[data-edit-child]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    openEditChildModal(
                        button.dataset.editChild
                    );
                }
            );
        });

    childrenList
        .querySelectorAll("[data-delete-child]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    deleteChild(
                        button.dataset.deleteChild
                    );
                }
            );
        });
}

async function loadInstitutions() {
    if (!supabaseClient || !currentUser) {
        return [];
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("institutions")
        .select(`
            institution_id,
            institution_name
        `)
        .order("institution_name", {
            ascending: true
        });

    if (error) {
        console.error(
            "Institutionen konnten nicht geladen werden:",
            error
        );

        return [];
    }

    return data || [];
}


async function openEditChildModal(childId) {
    const child = currentChildren.find(
        item =>
            String(item.id) === String(childId)
    );

    if (!child) {
        return;
    }

    const institutions =
        await loadInstitutions();

    const modal =
        document.createElement("div");

    modal.className = "modal";
    modal.id = "editChildModal";

    const groupOptions =
        currentGroups
            .map(group => `
                <option
                    value="${escapeHtml(group.id)}"
                    ${
                        String(group.id) ===
                        String(child.group_id)
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(
                        group.group_name ||
                        "Unbenannte Gruppe"
                    )}
                </option>
            `)
            .join("");

    const institutionOptions =
        institutions
            .map(institution => `
                <option
                    value="${escapeHtml(
                        institution.institution_id
                    )}"
                    ${
                        String(
                            institution.institution_id
                        ) ===
                        String(child.institution_id)
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(
                        institution.institution_name ||
                        "Unbenannte Institution"
                    )}
                </option>
            `)
            .join("");

    modal.innerHTML = `
        <div class="modal-content">

            <div class="modal-header">
                <h2>Kind bearbeiten</h2>

                <button
                    type="button"
                    class="btn btn-light"
                    id="closeEditChildModal"
                >
                    Schließen
                </button>
            </div>

            <div class="form-group">
                <label for="editChildCode">
                    Kinder-ID
                </label>

                <input
                    type="text"
                    id="editChildCode"
                    value="${escapeHtml(
                        child.child_code || ""
                    )}"
                    required
                >
            </div>

            <div class="form-group">
                <label for="editChildBirthDate">
                    Geburtsdatum
                </label>

                <input
                    type="date"
                    id="editChildBirthDate"
                    value="${escapeHtml(
                        child.birth_date || ""
                    )}"
                    required
                >
            </div>

            <div class="form-group">
                <label for="editChildGroup">
                    Gruppe
                </label>

                <select id="editChildGroup" required>
                    <option value="">
                        Gruppe auswählen...
                    </option>
                    ${groupOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="editChildInstitution">
                    Institution
                </label>

                <select id="editChildInstitution">
                    <option value="">
                        Institution auswählen...
                    </option>
                    ${institutionOptions}
                </select>
            </div>

            <button
                type="button"
                class="btn btn-success"
                id="saveEditedChild"
            >
                Änderungen speichern
            </button>

            <button
                type="button"
                class="btn btn-light"
                id="cancelEditChild"
            >
                Abbrechen
            </button>

            <div
                id="editChildMessage"
                class="message"
            ></div>

        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.remove();
    };

    byId("closeEditChildModal")
        ?.addEventListener("click", closeModal);

    byId("cancelEditChild")
        ?.addEventListener("click", closeModal);

    byId("saveEditedChild")
        ?.addEventListener(
            "click",
            () => saveEditedChild(child.id, modal)
        );
}


async function saveEditedChild(childId, modal) {
    const childCode =
        byId("editChildCode")
            ?.value
            ?.trim() || "";

    const birthDate =
        byId("editChildBirthDate")
            ?.value || "";

    const groupId =
        byId("editChildGroup")
            ?.value || "";

    const institutionId =
        byId("editChildInstitution")
            ?.value || null;

    const message =
        byId("editChildMessage");

    if (!childCode || !birthDate || !groupId) {
        safeText(
            message,
            "Bitte Kinder-ID, Geburtsdatum und Gruppe ausfüllen."
        );

        message?.classList.add("show", "error");

        return;
    }

    const saveButton =
        byId("saveEditedChild");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Wird gespeichert...";
    }

    const {
        error
    } = await supabaseClient
        .from("children")
        .update({
            child_code: childCode,
            birth_date: birthDate,
            group_id: Number(groupId),
            institution_id: institutionId
        })
        .eq("id", childId);

    if (error) {
        console.error(
            "Kind konnte nicht aktualisiert werden:",
            error
        );

        safeText(
            message,
            `Kind konnte nicht aktualisiert werden: ${
                error.message
            }`
        );

        message?.classList.add("show", "error");

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                "Änderungen speichern";
        }

        return;
    }

    modal.remove();

    await loadChildren();
}


async function deleteChild(childId) {
    const child =
        currentChildren.find(
            item =>
                String(item.id) === String(childId)
        );

    const childCode =
        child?.child_code || "dieses Kind";

    const confirmed =
        window.confirm(
            `Soll ${childCode} wirklich gelöscht werden?`
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("children")
        .delete()
        .eq("id", childId);

    if (error) {
        console.error(
            "Kind konnte nicht gelöscht werden:",
            error
        );

        alert(
            `Kind konnte nicht gelöscht werden: ${
                error.message
            }`
        );

        return;
    }

    if (
        String(currentChildId) === String(childId)
    ) {
        currentChildId = null;
        currentAnswers = {};
        currentQuestions = [];
    }

    await loadChildren();
}


/* ============================================================
   GRUPPEN
   ============================================================ */

function populateChildGroupSelect(groups) {
    const select = document.getElementById("newChildGroup");

    if (!select) {
        console.error(
            "Dropdown #newChildGroup wurde nicht gefunden."
        );
        return;
    }

    console.log("Gruppen für Dropdown:", groups);

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Gruppe auswählen...";
    select.appendChild(placeholder);

    if (!Array.isArray(groups) || groups.length === 0) {
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.disabled = true;
        emptyOption.textContent = "Keine Gruppen vorhanden";
        select.appendChild(emptyOption);

        return;
    }

    groups.forEach(group => {
        const option = document.createElement("option");

        option.value = String(group.id);

        // Prüft mehrere mögliche Spaltennamen
        option.textContent =
            group.group_name ||
            group.name ||
            group.title ||
            "Unbenannte Gruppe";

        select.appendChild(option);
    });

    console.log(
        "Dropdown-Optionen:",
        select.options.length
    );
}


async function loadGroups() {
    if (!supabaseClient || !currentUser) {
        return [];
    }

    

let query = supabaseClient
    .from("Groups")
    .select(`
        id,
        group_name,
        description,
        institution_id
    `)
    .order("group_name", {
        ascending: true
    });

    if (currentProfile?.institution_id) {
        query = query.eq(
            "institution_id",
            currentProfile.institution_id
        );
    }

    const {
        data,
        error
    } = await query;


    console.log("Gruppen-Abfrage:", {
        data,
        error,
        currentProfile
    });

    if (error) {
        console.error(
            "Gruppen konnten nicht geladen werden:",
            error
        );

        currentGroups = [];
        populateChildGroupSelect([]);

        return [];
    }

    currentGroups = data || [];

    renderGroups(currentGroups);
    populateChildGroupSelect(currentGroups);
    updateGroupsCount(currentGroups.length);

    return currentGroups;
}



function renderGroups(groups) {

    const container =
        byId("groupsList");


    if (!container) {
        return;
    }


    if (
        !groups ||
        groups.length === 0
    ) {

        container.innerHTML =
            "<p>Noch keine Gruppen vorhanden.</p>";

        return;

    }


    container.innerHTML = "";


    groups.forEach(group => {

        const item =
            document.createElement("div");


        item.className =
            "group-item";


        item.innerHTML =
            `
            <strong>
                ${escapeHtml(
                    group.group_name
                )}
            </strong>
            `;


        if (group.description) {

            item.innerHTML +=
                `
                <p>
                    ${escapeHtml(
                        group.description
                    )}
                </p>
                `;

        }


        container.appendChild(item);

    });

}


/* ============================================================
   ENTWICKLUNGSKOMPASS
   ============================================================ */

const DEVELOPMENT_AREAS = [

    {
        key: "motorik",
        label: "Motorik"
    },

    {
        key: "sprache",
        label: "Sprache & Kommunikation"
    },

    {
        key: "sozial",
        label: "Sozial-emotionale Entwicklung"
    },

    {
        key: "kognition",
        label: "Kognition & Lernen"
    },

    {
        key: "selbststaendigkeit",
        label: "Selbstständigkeit"
    }

];


/*
 * WICHTIG:
 * DEVELOPMENT_OPTIONS wird hier genau EINMAL definiert.
 */

const DEVELOPMENT_OPTIONS = [

    {
        value: "noch_nicht",
        label: "Noch nicht"
    },

    {
        value: "sicher",
        label: "Sicher"
    },

    {
        value: "teilweise",
        label: "Teilweise"
    },

    {
        value: "nicht_beobachtet",
        label: "Nicht beobachtet"
    }

];


/* ============================================================
   FRAGENKATALOG
   ============================================================ */

const DEVELOPMENT_QUESTIONS = [

    // =========================================================
    // 1–2,5 JAHRE
    // =========================================================

    {
        id: 1,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "1. Das Kind versteht Nomen (Hauptwörter wie Auto, Puppe)."
    },
    {
        id: 2,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "2. Es versteht Verben (Tätigkeitswörter wie essen, trinken, gehen, turnen)."
    },
    {
        id: 3,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "3. Es versteht Präpositionen (Lagebezeichnungen wie auf, unter, neben)."
    },
    {
        id: 4,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "4. Es versteht Adjektive (Eigenschaftswörter wie groß/klein, traurig/fröhlich)."
    },
    {
        id: 5,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "5. Es versteht Aufforderungen in konkreten Situationen und setzt diese um."
    },

    {
        id: 11,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "11. Das Kind spricht einzelne Wörter."
    },
    {
        id: 12,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "12. Es kann bis zu 50 Wörter sprechen."
    },

    {
        id: 21,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "21. Das Kind spricht die Vokale a, e, i, o, u."
    },
    {
        id: 22,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "22. Es produziert die Laute m, p, d, b, n."
    },

    {
        id: 36,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "36. Das Kind spricht Einwortsätze."
    },
    {
        id: 37,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "37. Es spricht Zweiwortsätze."
    },

    {
        id: 53,
        area: "sprache",
        age_from: 1,
        age_to: 2.5,
        question: "53. Das Kind variiert die Lautstärke je nach Stimmung und Situation."
    },

    {
        id: 57,
        area: "sozial",
        age_from: 1,
        age_to: 2.5,
        question: "57. Das Kind sucht und hält Blickkontakt."
    },
    {
        id: 58,
        area: "sozial",
        age_from: 1,
        age_to: 2.5,
        question: "58. Es hält Dialoge, die sich auf das unmittelbare Umfeld beziehen."
    },
    {
        id: 59,
        area: "sozial",
        age_from: 1,
        age_to: 2.5,
        question: "59. Es ist dem Sprecher zugewandt."
    },
    {
        id: 60,
        area: "sozial",
        age_from: 1,
        age_to: 2.5,
        question: "60. Es kann Wünsche äußern."
    },
    {
        id: 61,
        area: "sozial",
        age_from: 1,
        age_to: 2.5,
        question: "61. Es beginnt ein Gespräch von sich aus."
    },

    {
        id: 73,
        area: "literacy",
        age_from: 1,
        age_to: 2.5,
        question: "73. Das Kind ist an Büchern interessiert."
    },
    {
        id: 74,
        area: "literacy",
        age_from: 1,
        age_to: 2.5,
        question: "74. Es zeigt und benennt Dinge oder Tiere in Bilderbüchern oder ahmt sie nach."
    },

    {
        id: 83,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "83. Das Kind reagiert auf seinen Namen."
    },
    {
        id: 84,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "84. Es zeigt emotionale Reaktionen auf ein freundliches Gesicht."
    },
    {
        id: 85,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "85. Es hat eine gute Mundmotorik."
    },
    {
        id: 86,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "86. Es reagiert auf Flüstern."
    },
    {
        id: 87,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "87. Es erkennt verschiedene Geräusche und ordnet diese zu."
    },
    {
        id: 88,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "88. Es wendet sich einer Schallquelle zu (dreht den Kopf zum Geräusch)."
    },
    {
        id: 89,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "89. Es kann eine Reihe von Wörtern nachsprechen."
    },
    {
        id: 90,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "90. Es kann Dinge in der Nähe erkennen."
    },
    {
        id: 91,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "91. Es kann Dinge in der Ferne erkennen."
    },
    {
        id: 92,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "92. Es fühlt sich bei seinen Handlungen wohl."
    },
    {
        id: 93,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "93. Es ist an seiner Umwelt interessiert."
    },
    {
        id: 94,
        area: "grundlagen",
        age_from: 1,
        age_to: 2.5,
        question: "94. Es reagiert deutlich auf Interaktionsangebote."
    },


    // =========================================================
    // 2,5–4,5 JAHRE
    // =========================================================

    {
        id: 6,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "6. Es versteht einteilige situationsgebundene Aufforderungen und setzt diese um."
    },
    {
        id: 7,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "7. Es versteht mehrteilige Aufforderungen, die unabhängig von der jetzigen Situation sind, und setzt diese um."
    },
    {
        id: 8,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "8. Es versteht Zeitangaben wie heute, gestern, morgen."
    },

    {
        id: 13,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "13. Es verwendet Verben (Tätigkeitswörter, z.B. essen, laufen, schlafen)."
    },
    {
        id: 14,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "14. Es kennt und verwendet Adjektive (Eigenschaftswörter, z.B. dick, dünn, alt, jung)."
    },
    {
        id: 15,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "15. Es verwendet Präpositionen (Lagebezeichnungen, z.B. vor, auf, neben, in)."
    },
    {
        id: 16,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "16. Es benennt Farben."
    },

    {
        id: 23,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "23. Es bildet Laute w, f, l, t, ng (wie Junge), k, ch2 (wie hoch), s, z, h."
    },
    {
        id: 24,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "24. Es spricht die Laute j, r, g, pf."
    },
    {
        id: 25,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "25. Es produziert Konsonantenverbindungen, z.B. kl, fl, bl, gl, br, fr, gr."
    },

    {
        id: 38,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "38. Es verwendet Dreiwortsätze (das Verb steht am Satzende)."
    },
    {
        id: 39,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "39. Es bildet Drei- und Mehrwortsätze, wobei das Verb an der zweiten Position steht."
    },
    {
        id: 40,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "40. Es stellt W-Fragen."
    },
    {
        id: 41,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "41. Es verändert das Verb (Tätigkeitswort) entsprechend der Person (ich gehe, du gehst, wir gehen)."
    },
    {
        id: 42,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "42. Es verwendet Präpositionen (Verhältniswörter wie in, auf, unter) innerhalb eines Satzes richtig."
    },
    {
        id: 43,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "43. Es verwendet Plural (Mehrzahl)."
    },
    {
        id: 44,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "44. Es verwendet Artikel (Begleiter/Geschlechtswort: der, die, das, ein, eine)."
    },

    {
        id: 54,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "54. Es verändert seine Tonhöhe je nach Aussage des Satzes (Frage, Aussage etc.)."
    },
    {
        id: 55,
        area: "sprache",
        age_from: 2.5,
        age_to: 4.5,
        question: "55. Es kann einzelne Wörter betonen/akzentuieren, um diesen eine besondere Bedeutung zu verleihen."
    },

    {
        id: 62,
        area: "sozial",
        age_from: 2.5,
        age_to: 4.5,
        question: "62. Es hält den Sprecher-Hörer-Wechsel ein."
    },
    {
        id: 63,
        area: "sozial",
        age_from: 2.5,
        age_to: 4.5,
        question: "63. Es verdeutlicht sein Sprechen mit Mimik und Gestik."
    },
    {
        id: 64,
        area: "sozial",
        age_from: 2.5,
        age_to: 4.5,
        question: "64. Es verwendet „ich“."
    },
    {
        id: 65,
        area: "sozial",
        age_from: 2.5,
        age_to: 4.5,
        question: "65. Es spricht situationsangemessen."
    },
    {
        id: 66,
        area: "sozial",
        age_from: 2.5,
        age_to: 4.5,
        question: "66. Es berücksichtigt den Zuhörer und passt seine Reaktion bzw. seine Kommunikation an sein Gegenüber an."
    },

    {
        id: 75,
        area: "literacy",
        age_from: 2.5,
        age_to: 4.5,
        question: "75. Es nimmt aktiv an einer Bilderbuchbetrachtung teil."
    },
    {
        id: 76,
        area: "literacy",
        age_from: 2.5,
        age_to: 4.5,
        question: "76. Es erkennt Zusammenhänge aus Bildergeschichten und Bilderbüchern wieder."
    },
    {
        id: 77,
        area: "literacy",
        age_from: 2.5,
        age_to: 4.5,
        question: "77. Es konzentriert sich über einen längeren Zeitraum auf Geschichten und Erzählungen."
    },

    {
        id: 95,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "95. Es nimmt Gefühle anderer wahr und verhält sich empathisch."
    },
    {
        id: 96,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "96. Es kann mit Konzentration und Ausdauer bei der Sache bleiben."
    },
    {
        id: 97,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "97. Es kann Wesentliches von Unwesentlichem unterscheiden."
    },
    {
        id: 98,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "98. Es setzt seinen Körper entsprechend seinem Alter ein."
    },
    {
        id: 99,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "99. Es zeigt eine gute Koordination bei komplexen Bewegungsabläufen."
    },
    {
        id: 100,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "100. Es ist in Alltagshandlungen geschickt (z. B. zieht sich selbstständig an und aus)."
    },
    {
        id: 101,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "101. Es zeigt soziales Verhalten in der Gruppe."
    },
    {
        id: 102,
        area: "grundlagen",
        age_from: 2.5,
        age_to: 4.5,
        question: "102. Es besitzt ein positives Selbstwertgefühl."
    },


    // =========================================================
    // 4,5–6 JAHRE
    // =========================================================

    {
        id: 9,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "9. Es versteht Beziehungen und Auswirkungen (z.B. Es wird hell, wenn die Sonne aufgeht)."
    },
    {
        id: 10,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "10. Es versteht W-Fragen (das Kind antwortet richtig auf die ihm gestellten Fragen)."
    },

    {
        id: 17,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "17. Es benennt Dinge genau und detailliert (z.B. Wimpern)."
    },
    {
        id: 18,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "18. Es benennt Formen (Kreis, Dreieck, Viereck)."
    },
    {
        id: 19,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "19. Es kann Oberbegriffe benennen und richtig zuordnen (Apfel = Obst)."
    },
    {
        id: 20,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "20. Es kann sich differenziert ausdrücken (z.B. Abläufe genau erklären oder beschreiben)."
    },

    {
        id: 26,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "26. Es produziert Laute ch1 (wie in ich) und sch."
    },
    {
        id: 27,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "27. Es produziert auch schwierige Konsonantenverbindungen z.B. dr-, tr, kr, kn, sch-Verbindungen (z. B. Schmetterling, Straße, Schnecke etc.)."
    },
    {
        id: 28,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "28. Es spricht in Eins-zu-eins-Situationen deutlich, sodass es gut verstanden wird."
    },
    {
        id: 29,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "29. Es spricht im Gruppengeschehen deutlich."
    },
    {
        id: 30,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "30. Es erkennt Rhythmen und kann diese mitklatschen."
    },
    {
        id: 31,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "31. Es kann Wörter in Silben zerlegen/klatschen."
    },
    {
        id: 32,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "32. Es erkennt Reimwörter."
    },
    {
        id: 33,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "33. Es kann Reimwörter ergänzen."
    },
    {
        id: 34,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "34. Es unterscheidet ähnlich klingende Wörter."
    },
    {
        id: 35,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "35. Es erkennt Anlaute."
    },

    {
        id: 45,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "45. Es verwendet Adjektive (Eigenschaftswörter) im Satz richtig."
    },
    {
        id: 46,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "46. Es antwortet korrekt auf W-Fragen (Satzbau und Wortbildung sind korrekt)."
    },
    {
        id: 47,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "47. Es bildet Nebensätze, wobei das Verb im Nebensatz am Satzende steht."
    },
    {
        id: 48,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "48. Es gibt Situationen oder Ereignisse in richtiger zeitlicher Abfolge wieder."
    },
    {
        id: 49,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "49. Es bildet die vollendete Vergangenheit (Perfekt) richtig („Ich habe den Hund gestreichelt.“)."
    },
    {
        id: 50,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "50. Es bildet die Vergangenheitsform Präteritum (Imperfekt) richtig („Der Junge sagte zum Mädchen ...“)."
    },
    {
        id: 51,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "51. Es verwendet den Kasus Akkusativ korrekt (Wen- oder Was-Fall: „Das Mädchen isst den Apfel.“)."
    },

    {
        id: 56,
        area: "sprache",
        age_from: 4.5,
        age_to: 6,
        question: "56. Es ist in der Lage, einen sinnvollen Rhythmus einzuhalten."
    },

    {
        id: 67,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "67. Es bezieht nicht situatives Wissen mit ein."
    },
    {
        id: 68,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "68. Es fragt nach."
    },
    {
        id: 69,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "69. Es antwortet sinngemäß auf Fragen."
    },
    {
        id: 70,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "70. Es hört aufmerksam zu."
    },
    {
        id: 71,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "71. Es kann eine kurze Geschichte sinnvoll nacherzählen."
    },
    {
        id: 72,
        area: "sozial",
        age_from: 4.5,
        age_to: 6,
        question: "72. Es beschreibt etwas Besonderes."
    },

    {
        id: 78,
        area: "literacy",
        age_from: 4.5,
        age_to: 6,
        question: "78. Es kann Geschichten in logischer Reihenfolge wiedergeben."
    },
    {
        id: 79,
        area: "literacy",
        age_from: 4.5,
        age_to: 6,
        question: "79. Es versucht zu „schreiben“."
    },
    {
        id: 80,
        area: "literacy",
        age_from: 4.5,
        age_to: 6,
        question: "80. Es interessiert sich für Schrift und versucht, Buchstaben zu schreiben."
    },
    {
        id: 81,
        area: "literacy",
        age_from: 4.5,
        age_to: 6,
        question: "81. Es erkennt Bilder, Symbole und Piktogramme wieder, die häufig im Kindergarten verwendet werden."
    },
    {
        id: 82,
        area: "literacy",
        age_from: 4.5,
        age_to: 6,
        question: "82. Es erkennt einzelne Buchstaben wieder."
    }
];


/* ============================================================
   ENTWICKLUNGSBEREICH
   ============================================================ */

function ensureDevelopmentSection() {

    let section =
        document.querySelector(
            '[data-section-content="development"]'
        );


    if (section) {

        ensureDevelopmentMarkup(section);

        return section;

    }


    const main =
        document.querySelector("main");


    if (!main) {

        console.error(
            "Kein <main>-Element gefunden."
        );

        return null;

    }


    section =
        document.createElement("section");


    section.className =
        "section";


    section.dataset.sectionContent =
        "development";


    section.style.display =
        "none";


    main.appendChild(section);


    ensureDevelopmentMarkup(section);


    return section;

}


/* ============================================================
   ENTWICKLUNGS HTML
   ============================================================ */

function ensureDevelopmentMarkup(section) {

    if (
        section.querySelector(
            "#developmentChild"
        )
    ) {

        return;

    }

}
/* ============================================================
   ENTWICKLUNGS ELEMENTE
   ============================================================ */

function getDevelopmentElements() {

    return {

        section:
            byId("developmentSection") ||
            document.querySelector(
                '[data-section-content="development"]'
            ),

        childSelect:
            byId("developmentChild"),

        ageSelect:
            byId("developmentAge"),

        questionsContainer:
            byId("questionsContainer"),

        questionsMessage:
            byId("questionsMessage"),

        resultContainer:
            byId("developmentResult"),

        saveButton:
            byId("saveDevelopmentButton")

    };

}


/* ============================================================
   KINDER FÜR ENTWICKLUNG
   ============================================================ */

async function loadChildrenForDevelopment() {

    const {
        childSelect
    } =
        getDevelopmentElements();


    if (!childSelect) {

        console.error(
            "developmentChild wurde nicht gefunden."
        );

        return;

    }


    childSelect.innerHTML =
        `
        <option value="">
            Kinder werden geladen...
        </option>
        `;


    if (
        !currentChildren ||
        currentChildren.length === 0
    ) {

        await loadChildren();

    }


    childSelect.innerHTML =
        `
        <option value="">
            Kind auswählen...
        </option>
        `;


    if (
        !currentChildren ||
        currentChildren.length === 0
    ) {

        childSelect.innerHTML =
            `
            <option value="">
                Noch keine Kinder vorhanden
            </option>
            `;

        return;

    }


    currentChildren.forEach(child => {

        const option =
            document.createElement("option");


        /*
         * UUID unbedingt als String verwenden.
         */

        option.value =
            String(child.id);


        const groupName =
            child.Groups?.group_name ||
            "Keine Gruppe";


        option.textContent =
            `${child.child_code || "Kind"} – ${groupName}`;


        childSelect.appendChild(option);

    });

}


/* ============================================================
   ALTER
   ============================================================ */

function populateDevelopmentAge() {

    const {
        ageSelect
    } =
        getDevelopmentElements();


    if (!ageSelect) {
        return;
    }


    ageSelect.innerHTML =
        `
        <option value="">
            Alter auswählen...
        </option>
        `;


    for (
        let age = 1;
        age <= 7;
        age++
    ) {

        const option =
            document.createElement("option");


        option.value =
            String(age);


        option.textContent =
            age === 1
                ? "1 Jahr"
                : `${age} Jahre`;


        ageSelect.appendChild(option);

    }

}


/* ============================================================
   FRAGEN NACH ALTER
   ============================================================ */

function getQuestionsForAge(age) {

    const numericAge =
        Number(age);


    if (
        !Number.isFinite(numericAge)
    ) {

        return [];

    }


    return DEVELOPMENT_QUESTIONS.filter(
        question => {

            return (
                numericAge >= question.age_from &&
                numericAge <= question.age_to
            );

        }
    );

}


/* ============================================================
   FRAGEN RENDERN
   ============================================================ */

function renderDevelopmentQuestions(questions) {

    const {
        questionsContainer
    } =
        getDevelopmentElements();


    if (!questionsContainer) {
        return;
    }


    questionsContainer.innerHTML = "";


    currentQuestions =
        questions || [];


    if (
        currentQuestions.length === 0
    ) {

        questionsContainer.innerHTML =
            `
            <div class="card">
                <p>
                    Für dieses Alter sind derzeit keine Fragen hinterlegt.
                </p>
            </div>
            `;

        return;

    }


    currentQuestions.forEach(
        (question, index) => {

            const card =
                document.createElement("div");


            card.className =
                "card development-question";


            const area =
                DEVELOPMENT_AREAS.find(
                    item =>
                        item.key ===
                        question.area
                );


            const areaLabel =
                area?.label ||
                question.area;


            /*
             * Standard:
             * NOCH NICHT
             */

            const currentValue =
                currentAnswers[question.id] ||
                "noch_nicht";


            const currentOption =
                DEVELOPMENT_OPTIONS.find(
                    option =>
                        option.value ===
                        currentValue
                );


            const currentLabel =
                currentOption?.label ||
                "Noch nicht";


            const stateClass =
                `development-state-${currentValue}`;


            card.innerHTML =
                `
                <div class="development-question-number">
                    Frage ${index + 1}
                </div>


                <div class="development-question-area">
                    ${escapeHtml(areaLabel)}
                </div>


                <div class="development-question-text">
                    ${escapeHtml(question.question)}
                </div>


                <div class="development-rating-wrapper">

                    <button
                        type="button"
                        class="
                            development-rating-box
                            ${stateClass}
                        "
                        data-question-id="${question.id}"
                        data-value="${currentValue}"
                        aria-label="Bewertung: ${escapeHtml(currentLabel)}"
                        title="${escapeHtml(currentLabel)}"
                    >

                        <span class="development-rating-label">
                            ${escapeHtml(currentLabel)}
                        </span>

                    </button>

                </div>

                `;


            questionsContainer.appendChild(card);

        }
    );


    questionsContainer
        .querySelectorAll(
            ".development-rating-box"
        )
        .forEach(box => {

            box.addEventListener(
                "click",
                () => {

                    const questionId =
                        Number(
                            box.dataset.questionId
                        );


                    const currentValue =
                        currentAnswers[
                            questionId
                        ] ||
                        "noch_nicht";


                    let nextValue;


                    if (
                        currentValue ===
                        "noch_nicht"
                    ) {

                        nextValue =
                            "sicher";

                    }

                    else if (
                        currentValue ===
                        "sicher"
                    ) {

                        nextValue =
                            "teilweise";

                    }

                    else if (
                        currentValue ===
                        "teilweise"
                    ) {

                        nextValue =
                            "nicht_beobachtet";

                    }

                    else {

                        nextValue =
                            "noch_nicht";

                    }


                    currentAnswers[
                        questionId
                    ] =
                        nextValue;


                    updateDevelopmentRatingBox(
                        box,
                        nextValue
                    );

                }
            );

        });

}


/* ============================================================
   BEWERTUNGSKASTEN
   ============================================================ */

function updateDevelopmentRatingBox(
    box,
    value
) {

    if (!box) {
        return;
    }


    box.classList.remove(
        "development-state-noch_nicht",
        "development-state-sicher",
        "development-state-teilweise",
        "development-state-nicht_beobachtet"
    );


    box.classList.add(
        `development-state-${value}`
    );


    box.dataset.value =
        value;


    const option =
        DEVELOPMENT_OPTIONS.find(
            item =>
                item.value ===
                value
        );


    const label =
        box.querySelector(
            ".development-rating-label"
        );


    if (label) {

        label.textContent =
            option?.label ||
            "Noch nicht";

    }


    box.title =
        option?.label ||
        "Noch nicht";


    box.setAttribute(
        "aria-label",
        "Bewertung: " +
        (
            option?.label ||
            "Noch nicht"
        )
    );


    /*
     * Animation bei Teilweise neu starten.
     */

    box.classList.remove(
        "development-wave-animation"
    );


    if (
        value ===
        "teilweise"
    ) {

        void box.offsetWidth;

        box.classList.add(
            "development-wave-animation"
        );

    }

}


/* ============================================================
   CSS
   ============================================================ */

function ensureDevelopmentRatingStyles() {

    if (
        document.getElementById(
            "developmentRatingStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.id =
        "developmentRatingStyles";


    style.textContent =
        `

        .development-question {

            margin-bottom:20px;

        }


        .development-question-number {

            font-size:13px;

            color:#777;

            margin-bottom:6px;

        }


        .development-question-area {

            font-weight:600;

            margin-bottom:8px;

        }


        .development-question-text {

            font-size:17px;

            line-height:1.45;

            margin-bottom:18px;

        }


        .development-rating-wrapper {

            display:flex;

            justify-content:center;

            align-items:center;

            padding:10px 0 5px;

        }


        .development-rating-box {

            position:relative;

            width:100%;

            max-width:420px;

            height:85px;

            border-radius:16px;

            border:3px solid #d8d8d8;

            background:#ffffff;

            color:#555;

            cursor:pointer;

            overflow:hidden;

            display:flex;

            align-items:center;

            justify-content:center;

            font-size:17px;

            font-weight:700;

            transition:
                background .25s ease,
                border-color .25s ease,
                color .25s ease,
                transform .2s ease,
                box-shadow .25s ease;

        }


        .development-rating-box:hover {

            transform:scale(1.02);

            box-shadow:
                0 4px 14px rgba(
                    0,
                    0,
                    0,
                    .10
                );

        }


        .development-rating-label {

            position:relative;

            z-index:3;

            pointer-events:none;

        }


        /*
         * WEISS
         */

        .development-state-noch_nicht {

            background:#ffffff;

            border-color:#d8d8d8;

            color:#555;

        }


        /*
         * GRÜN
         */

        .development-state-sicher {

            background:#39b54a;

            border-color:#2f9e3f;

            color:#ffffff;

            box-shadow:
                0 4px 12px rgba(
                    57,
                    181,
                    74,
                    .25
                );

        }


        /*
         * HALB GRÜN / HALB WEISS
         */

        .development-state-teilweise {

            background:
                linear-gradient(
                    to right,
                    #39b54a 0%,
                    #39b54a 50%,
                    #ffffff 50%,
                    #ffffff 100%
                );

            border-color:#39b54a;

            color:#333;

            box-shadow:
                0 4px 12px rgba(
                    57,
                    181,
                    74,
                    .18
                );

        }


        /*
         * WELLEN
         */

        .development-state-teilweise::before {

            content:"";

            position:absolute;

            left:-30%;

            top:0;

            width:80%;

            height:100%;

            background:
                repeating-linear-gradient(
                    -45deg,
                    rgba(
                        255,
                        255,
                        255,
                        .22
                    ) 0px,
                    rgba(
                        255,
                        255,
                        255,
                        .22
                    ) 8px,
                    rgba(
                        255,
                        255,
                        255,
                        0
                    ) 8px,
                    rgba(
                        255,
                        255,
                        255,
                        0
                    ) 16px
                );

            pointer-events:none;

            z-index:1;

        }


        .development-wave-animation::before {

            animation:
                developmentRatingWave
                1.4s
                linear
                infinite;

        }


        @keyframes developmentRatingWave {

            from {

                transform:
                    translateX(0);

            }

            to {

                transform:
                    translateX(45%);

            }

        }


        /*
         * ROT
         */

        .development-state-nicht_beobachtet {

            background:#e53935;

            border-color:#c62828;

            color:#ffffff;

            box-shadow:
                0 4px 12px rgba(
                    229,
                    57,
                    53,
                    .25
                );

        }


        @media (
            max-width:600px
        ) {

            .development-rating-box {

                max-width:100%;

                height:75px;

                font-size:16px;

            }

        }

        `;


    document.head.appendChild(style);

}


/* ============================================================
   KIND GEÄNDERT
   ============================================================ */

async function handleDevelopmentChildChange(event) {
    currentChildId =
        event.target.value || null;

    currentAnswers = {};
    currentQuestions = [];
    currentAge = null;

    const {
        questionsContainer,
        questionsMessage,
        ageSelect,
        resultContainer
    } = getDevelopmentElements();

    if (resultContainer) {
        resultContainer.style.display = "none";
        resultContainer.innerHTML = "";
    }

    if (!currentChildId) {
        if (ageSelect) {
            ageSelect.value = "";
        }

        if (questionsContainer) {
            questionsContainer.innerHTML = `
                <p>
                    Bitte zuerst ein Kind auswählen.
                </p>
            `;
        }

        return;
    }

    const selectedChild =
        currentChildren.find(
            child =>
                String(child.id) ===
                String(currentChildId)
        );

    const calculatedAge =
        calculateChildAge(
            selectedChild?.birth_date
        );

    if (calculatedAge && ageSelect) {
        const ageValue = Math.min(
            7,
            Math.max(1, calculatedAge.years)
        );

        currentAge = ageValue;
        ageSelect.value = String(ageValue);

        const selectedOption =
            ageSelect.options[
                ageSelect.selectedIndex
            ];

        if (selectedOption) {
            selectedOption.textContent =
                formatChildAge(
                    selectedChild.birth_date
                );
        }

        currentQuestions =
            getQuestionsForAge(currentAge);

        renderDevelopmentQuestions(
            currentQuestions
        );
    }
    else {
        if (ageSelect) {
            ageSelect.value = "";
        }

        if (questionsContainer) {
            questionsContainer.innerHTML = `
                <p>
                    Für dieses Kind ist kein gültiges
                    Geburtsdatum vorhanden.
                </p>
            `;
        }
    }
await loadSavedDevelopmentReports();
enableDevelopmentReportActions();

    /*
     * Gespeicherte Auswertung laden.
     * Falls vorhanden, überschreibt deren Alter
     * die automatisch berechnete Anzeige.
     */
    const savedAssessment =
        await loadDevelopmentAssessment(
            currentChildId
        );

    if (savedAssessment) {
        safeText(
            questionsMessage,
            "Gespeicherte Auswertung wurde geladen."
        );

        if (questionsMessage) {
            questionsMessage.classList.add(
                "show",
                "success"
            );
        }

        return;
    }

    safeText(
        questionsMessage,
        ""
    );
}
    
/* ============================================================
   ALTER GEÄNDERT
   ============================================================ */

function handleDevelopmentAgeChange(event) {

    const age =
        Number(
            event.target.value
        );


    currentAge =
        Number.isFinite(age) &&
        age > 0
            ? age
            : null;


    currentAnswers = {};


    const {
        questionsContainer,
        questionsMessage
    } =
        getDevelopmentElements();


    if (!currentAge) {

        if (questionsContainer) {

            questionsContainer.innerHTML =
                `
                <p>
                    Bitte ein Alter auswählen.
                </p>
                `;

        }

        return;

    }


    if (!currentChildId) {

        safeText(
            questionsMessage,
            "Bitte zuerst ein Kind auswählen."
        );


        event.target.value = "";

        currentAge = null;

        return;

    }


    const questions =
        getQuestionsForAge(
            currentAge
        );


    renderDevelopmentQuestions(
        questions
    );

}


/* ============================================================
   EVENTS ENTWICKLUNG
   ============================================================ */

function setupDevelopmentEvents() {


if (currentChildId) {
    loadSavedDevelopmentReports();
}

   
    ensureDevelopmentRatingStyles();


   const {
    childSelect,
    ageSelect,
    saveButton
} =
    getDevelopmentElements();


const reportButton =
    byId(
        "createDevelopmentReportButton"
    );


const saveReportButton =
    byId(
        "saveDevelopmentReportButton"
    );


const printReportButton =
    byId(
        "printDevelopmentReportButton"
    );


    if (
        childSelect &&
        !childSelect.dataset.eventsReady
    ) {

        childSelect.dataset.eventsReady =
            "true";


        childSelect.addEventListener(
            "change",
            handleDevelopmentChildChange
        );

    }


    if (
        ageSelect &&
        !ageSelect.dataset.eventsReady
    ) {

        ageSelect.dataset.eventsReady =
            "true";


        ageSelect.addEventListener(
            "change",
            handleDevelopmentAgeChange
        );
if (
    reportButton &&
    !reportButton.dataset.eventsReady
) {

    reportButton.dataset.eventsReady =
        "true";


    reportButton.addEventListener(
        "click",
        handleCreateDevelopmentReport
    );

}


if (
    saveReportButton &&
    !saveReportButton.dataset.eventsReady
) {

    saveReportButton.dataset.eventsReady =
        "true";


    saveReportButton.addEventListener(
        "click",
        handleSaveDevelopmentReport
    );

}


if (
    printReportButton &&
    !printReportButton.dataset.eventsReady
) {

    printReportButton.dataset.eventsReady =
        "true";


    printReportButton.addEventListener(
        "click",
        printDevelopmentReport
    );

}
    }


   function handleCreateDevelopmentReport() {

    const validation =
        validateDevelopment();


    if (!validation.valid) {

        const {
            questionsMessage
        } =
            getDevelopmentElements();


        safeText(
            questionsMessage,
            validation.message
        );


        if (questionsMessage) {

            questionsMessage.style.color =
                "red";

        }


        return;

    }


    const result =
        calculateDevelopmentResult();


    const report =
        generateDevelopmentReport(
            result
        );


    const form =
        byId(
            "developmentReportForm"
        );


    if (form) {

        form.style.display =
            "";

    }


    showDevelopmentReport(
        report
    );

}

   function printDevelopmentReport() {

    const report =
        byId(
            "developmentReportDocument"
        );


    if (!report) {

        alert(
            "Bitte zuerst ein Gutachten erstellen."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank"
        );


    if (!printWindow) {

        alert(
            "Das Druckfenster konnte nicht geöffnet werden."
        );

        return;

    }


    printWindow.document.write(
        `
        <!DOCTYPE html>

        <html lang="de">

        <head>

            <meta charset="UTF-8">

            <title>
                Entwicklungsgutachten
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        Helvetica,
                        sans-serif;

                    color:#222;

                    line-height:1.5;

                    margin:40px;

                }


                h1 {

                    font-size:28px;

                    margin-bottom:5px;

                }


                h2 {

                    margin-top:30px;

                    border-bottom:
                        1px solid #ddd;

                    padding-bottom:6px;

                }


                .development-report-header {

                    text-align:center;

                    margin-bottom:40px;

                }


                .report-main-score {

                    text-align:center;

                    padding:25px;

                    background:#f3f4f6;

                    border-radius:12px;

                    margin:20px 0;

                }


                .report-main-score span {

                    display:block;

                }


                .report-main-score strong {

                    display:block;

                    font-size:42px;

                }


                .report-area {

                    margin-bottom:20px;

                }


                .report-area-header {

                    display:flex;

                    justify-content:
                        space-between;

                    font-weight:bold;

                }


                .report-progress {

                    height:12px;

                    background:#e5e7eb;

                    border-radius:10px;

                    overflow:hidden;

                }


                .report-progress-bar {

                    height:100%;

                    background:#39b54a;

                }


                .development-report-footer {

                    margin-top:70px;

                    display:grid;

                    gap:30px;

                }


                @media print {

                    body {

                        margin:20mm;

                    }

                }

            </style>

        </head>


        <body>

            ${report.outerHTML}

        </body>

        </html>
        `
    );


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        () => {

            printWindow.print();

        },
        500
    );

}

    if (
        saveButton &&
        !saveButton.dataset.eventsReady
    ) {

        saveButton.dataset.eventsReady =
            "true";


        saveButton.addEventListener(
            "click",
            handleDevelopmentSave
        );

    }

}


/* ============================================================
   VALIDIEREN
   ============================================================ */

function validateDevelopment() {

    if (!currentChildId) {

        return {

            valid:false,

            message:
                "Bitte zuerst ein Kind auswählen."

        };

    }


    if (!currentAge) {

        return {

            valid:false,

            message:
                "Bitte zuerst das Alter auswählen."

        };

    }


    if (
        !currentQuestions ||
        currentQuestions.length === 0
    ) {

        return {

            valid:false,

            message:
                "Für dieses Alter sind keine Fragen vorhanden."

        };

    }


    const unanswered =
        currentQuestions.filter(
            question =>
                !currentAnswers[
                    question.id
                ]
        );


    if (
        unanswered.length > 0
    ) {

        return {

            valid:false,

            message:
                `Bitte beantworte noch ${unanswered.length} Frage(n).`

        };

    }


    return {

        valid:true,

        message:""

    };

}


/* ============================================================
   AUSWERTUNG
   ============================================================ */

function calculateDevelopmentResult() {

    const result = {

        total: 0,

        noch_nicht: 0,

        teilweise: 0,

        sicher: 0,

        nicht_beobachtet: 0,

        percentage: 0,

        areas: {}

    };


    /*
     * Gesamtwerte vorbereiten
     */

    currentQuestions.forEach(question => {

        if (!result.areas[question.area]) {

            const area =
                DEVELOPMENT_AREAS.find(
                    item =>
                        item.key === question.area
                );

            result.areas[question.area] = {

                key: question.area,

                label:
                    area?.label ||
                    question.area,

                total: 0,

                sicher: 0,

                teilweise: 0,

                noch_nicht: 0,

                nicht_beobachtet: 0,

                percentage: 0

            };

        }

    });


    /*
     * Antworten auswerten
     */

    currentQuestions.forEach(question => {

        const answer =
            currentAnswers[question.id];

        if (!answer) {
            return;
        }


        result.total++;


        if (
            Object.prototype.hasOwnProperty.call(
                result,
                answer
            )
        ) {

            result[answer]++;

        }


        const area =
            result.areas[question.area];


        if (!area) {
            return;
        }


        area.total++;


        if (
            Object.prototype.hasOwnProperty.call(
                area,
                answer
            )
        ) {

            area[answer]++;

        }

    });


    /*
     * Gesamtprozent berechnen
     *
     * "Nicht beobachtet" wird ignoriert.
     */

    const observable =
        result.total -
        result.nicht_beobachtet;


    if (observable > 0) {

        result.percentage =
            Math.round(
                (
                    result.sicher +
                    (result.teilweise * 0.5)
                ) /
                observable *
                100
            );

    }


    /*
     * Prozent je Entwicklungsbereich
     */

    Object.values(result.areas)
        .forEach(area => {

            const areaObservable =
                area.total -
                area.nicht_beobachtet;


            if (areaObservable > 0) {

                area.percentage =
                    Math.round(
                        (
                            area.sicher +
                            (area.teilweise * 0.5)
                        ) /
                        areaObservable *
                        100
                    );

            }

        });


    return result;

}

    

/* ============================================================
   AUSWERTUNG ANZEIGEN
   ============================================================ */

function showDevelopmentResult(result) {

    const {
        resultContainer
    } =
        getDevelopmentElements();


    if (!resultContainer) {
        return;
    }


    const areaEntries =
        Object.values(result.areas);


    let areasHtml = "";


    areaEntries.forEach(area => {

        let status = "Beobachtungsbedarf";


        if (area.percentage >= 80) {

            status = "Sehr sicher";

        }

        else if (area.percentage >= 60) {

            status = "Überwiegend sicher";

        }

        else if (area.percentage >= 40) {

            status = "Teilweise entwickelt";

        }


        areasHtml +=
            `
            <div class="development-result-area">

                <div class="development-result-area-header">

                    <strong>
                        ${escapeHtml(area.label)}
                    </strong>

                    <span>
                        ${area.percentage} %
                    </span>

                </div>


                <div class="development-result-progress">

                    <div
                        class="development-result-progress-bar"
                        style="width:${area.percentage}%"
                    ></div>

                </div>


                <div class="development-result-area-status">

                    ${escapeHtml(status)}

                </div>


                <div class="development-result-area-details">

                    <span>
                        Voll: ${area.sicher}
                    </span>

                    <span>
                        Teilweise: ${area.teilweise}
                    </span>

                    <span>
                        Noch nicht gewertet: ${area.noch_nicht}
                    </span>

                    <span>
                        Nicht sichtbar: ${area.nicht_beobachtet}
                    </span>

                </div>

            </div>
            `;

    });


    resultContainer.innerHTML =
        `
        <div class="development-result-card">

            <h2>
                Auswertung
            </h2>


            <div class="development-result-overview">

                <div class="development-result-main-score">

                    <span>
                        Gesamtentwicklung
                    </span>

                    <strong>
                        ${result.percentage} %
                    </strong>

                </div>


                <div class="development-result-summary">

                    <div>
                        <span>Sicher</span>
                        <strong>${result.sicher}</strong>
                    </div>

                    <div>
                        <span>Teilweise</span>
                        <strong>${result.teilweise}</strong>
                    </div>

                    <div>
                        <span>Noch nicht</span>
                        <strong>${result.noch_nicht}</strong>
                    </div>

                    <div>
                        <span>Nicht beobachtet</span>
                        <strong>${result.nicht_beobachtet}</strong>
                    </div>

                </div>

            </div>


            <h3>
                Entwicklungsbereiche
            </h3>


            <div class="development-result-areas">

                ${areasHtml}

            </div>

        </div>
        `;


    resultContainer.style.display = "";

}

function ensureDevelopmentResultStyles() {

    if (
        document.getElementById(
            "developmentResultStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "developmentResultStyles";


    style.textContent = `

        .development-result-card {

            margin-top:30px;

            padding:25px;

            border-radius:18px;

            background:#ffffff;

            box-shadow:
                0 5px 20px rgba(0,0,0,.08);

        }


        .development-result-card h2 {

            margin-top:0;

        }


        .development-result-card h3 {

            margin-top:30px;

        }


        .development-result-overview {

            display:grid;

            grid-template-columns:
                minmax(180px, 1fr)
                2fr;

            gap:25px;

            align-items:center;

        }


        .development-result-main-score {

            text-align:center;

            padding:25px;

            border-radius:16px;

            background:#f5f7f8;

        }


        .development-result-main-score span {

            display:block;

            font-size:14px;

            color:#666;

            margin-bottom:8px;

        }


        .development-result-main-score strong {

            font-size:42px;

        }


        .development-result-summary {

            display:grid;

            grid-template-columns:
                repeat(4, 1fr);

            gap:10px;

        }


        .development-result-summary div {

            padding:15px;

            text-align:center;

            border-radius:12px;

            background:#f7f7f7;

        }


        .development-result-summary span {

            display:block;

            font-size:13px;

            color:#666;

            margin-bottom:5px;

        }


        .development-result-summary strong {

            font-size:22px;

        }


        .development-result-area {

            padding:18px 0;

            border-bottom:
                1px solid #eeeeee;

        }


        .development-result-area-header {

            display:flex;

            justify-content:space-between;

            align-items:center;

            margin-bottom:8px;

        }


        .development-result-area-header span {

            font-weight:700;

        }


        .development-result-progress {

            height:12px;

            border-radius:10px;

            background:#eeeeee;

            overflow:hidden;

        }


        .development-result-progress-bar {

            height:100%;

            border-radius:10px;

            background:#39b54a;

            transition:width .5s ease;

        }


        .development-result-area-status {

            margin-top:8px;

            font-size:14px;

            color:#555;

        }


        .development-result-area-details {

            display:flex;

            flex-wrap:wrap;

            gap:15px;

            margin-top:10px;

            font-size:13px;

            color:#666;

        }


        @media (max-width:700px) {

            .development-result-overview {

                grid-template-columns:1fr;

            }


            .development-result-summary {

                grid-template-columns:
                    repeat(2, 1fr);

            }

        }

    `;


    document.head.appendChild(style);

}


/* ============================================================
   AUSWERTUNG ERSTELLEN
   ============================================================ */
async function saveDevelopmentAssessment(result) {
    if (!supabaseClient) {
        throw new Error("Supabase Client ist nicht verfügbar.");
    }

    const {
        data: {
            user
        },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user?.id) {
        throw new Error(
            "Kein authentifizierter Benutzer gefunden."
        );
    }

    if (!currentChildId) {
        throw new Error("Kein Kind ausgewählt.");
    }

    if (!currentAge) {
        throw new Error("Kein Alter ausgewählt.");
    }

    const payload = {
        child_id: currentChildId,
        user_id: user.id,
        age: currentAge,
        answers: currentAnswers,
        result,
        updated_at: new Date().toISOString()
    };

    console.log(
        "Payload vor dem Speichern:",
        payload
    );

    const {
        data,
        error
    } = await supabaseClient
        .from("development_assessments")
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error(
            "Entwicklungsauswertung konnte nicht gespeichert werden:",
            error
        );

        throw error;
    }

    return data;
}




async function loadDevelopmentAssessment(childId) {

    if (!supabaseClient || !childId) {
        return null;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("development_assessments")
            .select(`
                id,
                child_id,
                age,
                answers,
                result,
                created_at
            `)
            .eq(
                "child_id",
                childId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Gespeicherte Auswertung konnte nicht geladen werden:",
            error
        );

        return null;

    }


    if (!data) {
        return null;
    }


    /*
     * Gespeicherte Daten übernehmen
     */

    currentAnswers =
        data.answers || {};


    currentAge =
        Number(data.age) || null;


    /*
     * Alter auswählen
     */

    const {
        ageSelect
    } =
        getDevelopmentElements();


    if (ageSelect && currentAge) {

        ageSelect.value =
            String(currentAge);

    }


    /*
     * Fragen für das gespeicherte Alter laden
     */

    if (currentAge) {

        currentQuestions =
            getQuestionsForAge(
                currentAge
            );


        renderDevelopmentQuestions(
            currentQuestions
        );

    }


    /*
     * Gespeicherte Auswertung anzeigen
     */

    if (data.result) {

        showDevelopmentResult(
            data.result
        );

    }


    console.log(
        "Gespeicherte Auswertung geladen:",
        data
    );


    return data;

}

function getCurrentDevelopmentChild() {

    return currentChildren.find(
        child =>
            String(child.id) ===
            String(currentChildId)
    ) || null;

}


function generateDevelopmentReport(result) {

    const child =
        getCurrentDevelopmentChild();


    const childCode =
        child?.child_code ||
        "Unbekanntes Kind";


    const today =
        new Date().toLocaleDateString(
            "de-DE"
        );


    const strongAreas =
        Object.values(result.areas)
            .filter(
                area =>
                    area.percentage >= 60
            );


    const supportAreas =
        Object.values(result.areas)
            .filter(
                area =>
                    area.percentage < 60
            );


    let strengthsText =
        strongAreas.length > 0
            ? strongAreas
                .map(
                    area =>
                        `${area.label} (${area.percentage} %)`
                )
                .join(", ")
            : "Es konnten derzeit keine deutlich ausgeprägten Stärken anhand der Auswertung hervorgehoben werden.";


    let supportText =
        supportAreas.length > 0
            ? supportAreas
                .map(
                    area =>
                        `${area.label} (${area.percentage} %)`
                )
                .join(", ")
            : "Es zeigen sich derzeit keine ausgeprägten Unterstützungsbedarfe.";


    const observations =
        byId(
            "reportObservations"
        )?.value?.trim() || "";


    const strengths =
        byId(
            "reportStrengths"
        )?.value?.trim() ||
        strengthsText;


    const supportNeeds =
        byId(
            "reportSupportNeeds"
        )?.value?.trim() ||
        supportText;


    const recommendations =
        byId(
            "reportRecommendations"
        )?.value?.trim() ||
        "Die weitere Entwicklung sollte im pädagogischen Alltag regelmäßig beobachtet und dokumentiert werden. Entwicklungsfortschritte sollten gemeinsam mit dem Kind und den Bezugspersonen reflektiert werden.";


    return {

        childCode,

        age:
            currentAge,

        date:
            today,

        observations,

        strengths,

        supportNeeds,

        recommendations,

        result

    };

}

function showDevelopmentReport(report) {

    const container =
        byId(
            "developmentReport"
        );


    if (!container) {
        return;
    }


    const areaEntries =
        Object.values(
            report.result.areas
        );


    let areasHtml = "";


    areaEntries.forEach(
        area => {

            let status =
                "Beobachtungsbedarf";


            if (
                area.percentage >= 80
            ) {

                status =
                    "Sehr sicher";

            }

            else if (
                area.percentage >= 60
            ) {

                status =
                    "Überwiegend sicher";

            }

            else if (
                area.percentage >= 40
            ) {

                status =
                    "Teilweise entwickelt";

            }


            areasHtml +=
                `
                <div class="report-area">

                    <div class="report-area-header">

                        <strong>
                            ${escapeHtml(
                                area.label
                            )}
                        </strong>

                        <span>
                            ${area.percentage} %
                        </span>

                    </div>


                    <div class="report-progress">

                        <div
                            class="report-progress-bar"
                            style="
                                width:${area.percentage}%
                            "
                        ></div>

                    </div>


                    <p>
                        ${escapeHtml(status)}
                    </p>

                </div>
                `;

        }
    );


    container.innerHTML =
        `
        <article
            class="development-report-document"
            id="developmentReportDocument"
        >

            <header
                class="development-report-header"
            >

                <h1>
                    Entwicklungsgutachten
                </h1>

                <p>
                    Entwicklungskompass
                </p>

            </header>


            <section
                class="development-report-child"
            >

                <h2>
                    Angaben zum Kind
                </h2>

                <p>
                    <strong>Kind:</strong>
                    ${escapeHtml(
                        report.childCode
                    )}
                </p>

                <p>
                    <strong>Alter:</strong>
                    ${report.age} Jahre
                </p>

                <p>
                    <strong>Erstellt am:</strong>
                    ${escapeHtml(
                        report.date
                    )}
                </p>

            </section>


            <section>

                <h2>
                    Zusammenfassung
                </h2>

                <div
                    class="report-main-score"
                >

                    <span>
                        Gesamter Entwicklungsstand
                    </span>

                    <strong>
                        ${report.result.percentage} %
                    </strong>

                </div>

            </section>


            <section>

                <h2>
                    Entwicklungsbereiche
                </h2>

                ${areasHtml}

            </section>


            <section>

                <h2>
                    Beobachtungen
                </h2>

                <p class="report-text">
                    ${escapeHtml(
                        report.observations ||
                        "Keine zusätzlichen Beobachtungen dokumentiert."
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>

            </section>


            <section>

                <h2>
                    Stärken und Ressourcen
                </h2>

                <p class="report-text">
                    ${escapeHtml(
                        report.strengths
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>

            </section>


            <section>

                <h2>
                    Entwicklungs- und Unterstützungsbedarf
                </h2>

                <p class="report-text">
                    ${escapeHtml(
                        report.supportNeeds
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>

            </section>


            <section>

                <h2>
                    Pädagogische Empfehlungen
                </h2>

                <p class="report-text">
                    ${escapeHtml(
                        report.recommendations
                    ).replace(
                        /\n/g,
                        "<br>"
                    )}
                </p>

            </section>


            <footer
                class="development-report-footer"
            >

                <div>
                    Ort / Datum:
                    __________________________
                </div>


                <div>
                    Pädagogische Fachkraft:
                    __________________________
                </div>


                <div>
                    Unterschrift:
                    __________________________
                </div>

            </footer>

        </article>
        `;


    container.style.display =
        "";

}

async function saveDevelopmentReport(report) {

const createReportButton =
    byId(
        "createDevelopmentReportButton"
    );

if (
    createReportButton &&
    !createReportButton.dataset.eventsReady
) {

    createReportButton.dataset.eventsReady =
        "true";

    createReportButton.addEventListener(
        "click",
        handleCreateDevelopmentReport
    );

}


const saveReportButton =
    byId(
        "saveDevelopmentReportButton"
    );

if (
    saveReportButton &&
    !saveReportButton.dataset.eventsReady
) {

    saveReportButton.dataset.eventsReady =
        "true";

    saveReportButton.addEventListener(
        "click",
        handleSaveDevelopmentReport
    );

}


const printReportButton =
    byId(
        "printDevelopmentReportButton"
    );

if (
    printReportButton &&
    !printReportButton.dataset.eventsReady
) {

    printReportButton.dataset.eventsReady =
        "true";

    printReportButton.addEventListener(
        "click",
        printDevelopmentReport
    );

}
   
    if (!supabaseClient) {

        throw new Error(
            "Supabase Client ist nicht verfügbar."
        );

    }


    if (!currentChildId) {

        throw new Error(
            "Kein Kind ausgewählt."
        );

    }


    const {
        data: assessment
    } =
        await supabaseClient
            .from(
                "development_assessments"
            )
            .select(
                "id"
            )
            .eq(
                "child_id",
                currentChildId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "development_reports"
            )
            .insert({

                child_id:
                    currentChildId,

                assessment_id:
                    assessment?.id ||
                    null,

                age:
                    currentAge,

                report_title:
                    "Entwicklungsgutachten",

                observations:
                    report.observations,

                strengths:
                    report.strengths,

                support_needs:
                    report.supportNeeds,

                recommendations:
                    report.recommendations,

                report_text:
                    JSON.stringify(
                        report
                    ),

                result:
                    report.result,

                created_by:
                    currentUser?.id ||
                    null

            })
            .select()
            .single();


    if (error) {

        console.error(
            "Gutachten konnte nicht gespeichert werden:",
            error
        );

        throw error;

    }


    return data;

}
let currentDevelopmentReport = null;


/* ============================================================
   ENTWICKLUNGSGUTACHTEN ERSTELLEN
   ============================================================ */

async function handleCreateDevelopmentReport() {

    const message =
        byId("developmentReportMessage");

    if (!currentChildId) {

        safeText(
            message,
            "Bitte zuerst ein Kind auswählen."
        );

        return;
    }

    try {

        safeText(
            message,
            "Entwicklungsgutachten wird erstellt..."
        );

        /*
         * Aktuelle Auswertung berechnen
         */
        const result =
            calculateDevelopmentResult();

        /*
         * Gutachten auf Basis der Auswertung erstellen
         */
        const report =
            generateDevelopmentReport(result);


        currentDevelopmentReport =
            report;

        /*
         * Gutachten anzeigen
         */
        showDevelopmentReport(report);

        /*
         * Buttons aktivieren
         */
        const saveButton =
            byId(
                "saveDevelopmentReportButton"
            );

        const printButton =
            byId(
                "printDevelopmentReportButton"
            );

        if (saveButton) {
            saveButton.disabled = false;
        }

        if (printButton) {
            printButton.disabled = false;
        }

        safeText(
            message,
            "Entwicklungsgutachten wurde erstellt."
        );

    }
    catch (error) {

        console.error(
            "Fehler beim Erstellen des Gutachtens:",
            error
        );

        safeText(
            message,
            "Das Entwicklungsgutachten konnte nicht erstellt werden."
        );

    }

}


/* ============================================================
   GUTACHTEN SPEICHERN
   ============================================================ */

async function handleSaveDevelopmentReport() {

    const message =
        byId("developmentReportMessage");

    if (!currentDevelopmentReport) {

        safeText(
            message,
            "Bitte zuerst ein Gutachten erstellen."
        );

        return;
    }

    if (!currentChildId) {

        safeText(
            message,
            "Kein Kind ausgewählt."
        );

        return;
    }

    const button =
        byId(
            "saveDevelopmentReportButton"
        );

    try {

        if (button) {

            button.disabled = true;
            button.textContent =
                "Wird gespeichert...";

        }

        await saveDevelopmentReport(
            currentDevelopmentReport
        );

        safeText(
            message,
            "Gutachten wurde erfolgreich gespeichert."
        );

        await loadSavedDevelopmentReports();

    }
    catch (error) {

        console.error(
            "Fehler beim Speichern des Gutachtens:",
            error
        );

    safeText(
        message,
        `Speichern fehlgeschlagen: ${
            error?.message || "Unbekannter Datenbankfehler"
        }`
    );


    }
    finally {

        if (button) {

            button.disabled = false;
            button.textContent =
                "Gutachten speichern";

        }

    }

}


/* ============================================================
   GESPEICHERTE GUTACHTEN LADEN
   ============================================================ */

async function loadSavedDevelopmentReports() {

    const container =
        byId(
            "savedDevelopmentReportsList"
        );

    if (!container || !currentChildId) {
        return;
    }

if (!supabaseClient) {
        container.innerHTML =
            "<p>Keine Verbindung zur Datenbank.</p>";
        return;
    }

    container.innerHTML =
        `
        <div class="card">
            <p>Gutachten werden geladen...</p>
        </div>
        `;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "development_reports"
                )
                .select(`
                    id,
                    child_id,
                    age,
                    report_title,
                    observations,
                    strengths,
                    support_needs,
                    recommendations,
                    report_text,
                    result,
                    created_at
                `)
                .eq(
                    "child_id",
                    currentChildId
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML =
                `
                <div class="card">
                    <p>
                        Für dieses Kind wurden noch keine
                        Gutachten gespeichert.
                    </p>
                </div>
                `;

            return;
        }

        container.innerHTML =
            data
                .map(
                    report => {

                        const date =
                            new Date(
                                report.created_at
                            ).toLocaleString(
                                "de-DE"
                            );

                        return `
                        <div
                            class="saved-report-card"
                            data-report-id="${escapeHtml(
                                report.id
                            )}"
                        >

                            <div>
                                <strong>
                                    ${escapeHtml(
                                        report.report_title ||
                                        "Entwicklungsgutachten"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(date)}
                                </small>
                            </div>

                            <div class="saved-report-actions">

                                <button
    type="button"
    class="btn btn-secondary"
    data-open-report="${escapeHtml(report.id)}"
>
    Öffnen
</button>

<button
    type="button"
    class="btn btn-danger"
    data-delete-report="${escapeHtml(report.id)}"
>
    Löschen
                                </button>
                            </div>
                        </div>
                        `;
                    }
                )
                .join("");

        container
        .querySelectorAll("[data-open-report]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => loadDevelopmentReport(
                    button.dataset.openReport
                )
            );
        });

    container
        .querySelectorAll("[data-delete-report]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => deleteDevelopmentReport(
                    button.dataset.deleteReport
                )
            );
        });
}
    catch (error) {

        console.error(
            "Gespeicherte Gutachten konnten nicht geladen werden:",
            error
        );

        container.innerHTML =
            `
            <div class="card">
                <p>
                    Gespeicherte Gutachten konnten nicht geladen werden.
                </p>
            </div>
            `;

    }

}


/* ============================================================
   GUTACHTEN ÖFFNEN
   ============================================================ */

async function loadDevelopmentReport(
    reportId
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "development_reports"
                )
                .select("*")
                .eq(
                    "id",
                    reportId
                )
                .eq(
                    "child_id",
                    currentChildId
                )
                .single();

        if (error) {
            throw error;
        }

        let report =
            null;

        if (data.report_text) {

            try {

                report =
                    JSON.parse(
                        data.report_text
                    );

            }
            catch {
                report = null;
            }

        }

        /*
         * Falls report_text nicht mehr geparst werden kann,
         * aus den gespeicherten Feldern wieder aufbauen.
         */
        if (!report) {

            report = {

                childCode:
                    currentChildId,

                age:
                    data.age,

                date:
                    new Date(
                        data.created_at
                    ).toLocaleDateString(
                        "de-DE"
                    ),

                observations:
                    data.observations || "",

                strengths:
                    data.strengths || "",

                supportNeeds:
                    data.support_needs || "",

                recommendations:
                    data.recommendations || "",

                result:
                    data.result || {
                        percentage: 0,
                        areas: {}
                    }

            };

        }

        currentDevelopmentReport =
            report;

        showDevelopmentReport(
            report
        );

        const saveButton =
            byId(
                "saveDevelopmentReportButton"
            );

        const printButton =
            byId(
                "printDevelopmentReportButton"
            );

        if (saveButton) {
            saveButton.disabled = false;
        }

        if (printButton) {
            printButton.disabled = false;
        }

        safeText(
            byId(
                "developmentReportMessage"
            ),
            "Gespeichertes Gutachten wurde geladen."
        );

    }
    catch (error) {

        console.error(
            "Gutachten konnte nicht geladen werden:",
            error
        );

        safeText(
            byId(
                "developmentReportMessage"
            ),
            "Das Gutachten konnte nicht geladen werden."
        );

    }

}


/* ============================================================
   GUTACHTEN LÖSCHEN
   ============================================================ */

async function deleteDevelopmentReport(
    reportId
) {

    if (
        !confirm(
            "Soll dieses Gutachten wirklich gelöscht werden?"
        )
    ) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "development_reports"
                )
                .delete()
                .eq(
                    "id",
                    reportId
                )
                .eq(
                    "child_id",
                    currentChildId
                );

        if (error) {
            throw error;
        }

        await loadSavedDevelopmentReports();

        safeText(
            byId(
                "developmentReportMessage"
            ),
            "Gutachten wurde gelöscht."
        );

    }
    catch (error) {

        console.error(
            "Gutachten konnte nicht gelöscht werden:",
            error
        );

        safeText(
            byId(
                "developmentReportMessage"
            ),
            "Das Gutachten konnte nicht gelöscht werden."
        );

    }

}


/* ============================================================
   GUTACHTEN DRUCKEN / PDF
   ============================================================ */

function printDevelopmentReport() {

    const report =
        byId(
            "developmentReportDocument"
        );

    if (!report) {

        alert(
            "Bitte zuerst ein Gutachten erstellen."
        );

        return;
    }

    const printWindow =
        window.open(
            "",
            "_blank"
        );

    if (!printWindow) {

        alert(
            "Das Druckfenster konnte nicht geöffnet werden."
        );

        return;
    }

    printWindow.document.write(
        `
        <!DOCTYPE html>

        <html lang="de">

        <head>

            <meta charset="UTF-8">

            <title>
                Entwicklungsgutachten
            </title>

            <style>

                body {
                    font-family:
                        Arial,
                        sans-serif;

                    color: #222;

                    margin: 40px;
                }

                h1 {
                    color: #234;
                }

                h2 {
                    margin-top: 30px;
                    border-bottom:
                        1px solid #ddd;
                    padding-bottom: 6px;
                }

                .report-area {
                    margin-bottom: 18px;
                }

                .report-progress {
                    height: 10px;
                    background: #eee;
                    border-radius: 5px;
                    overflow: hidden;
                }

                .report-progress-bar {
                    height: 100%;
                    background: #4f7cff;
                }

                .report-main-score {
                    font-size: 22px;
                    font-weight: bold;
                    padding: 15px;
                    background: #f5f7fa;
                }

                .development-report-footer {
                    margin-top: 60px;
                    display: grid;
                    gap: 30px;
                }

                @media print {

                    body {
                        margin: 20mm;
                    }

                }

            </style>

        </head>

        <body>

            ${report.innerHTML}

        </body>

        </html>
        `
    );

    printWindow.document.close();

    printWindow.focus();

    setTimeout(
        () => {

            printWindow.print();

        },
        300
    );

}
async function handleDevelopmentSave() {

    const {
        saveButton,
        questionsMessage
    } =
        getDevelopmentElements();


    const validation =
        validateDevelopment();


    if (!validation.valid) {

        safeText(
            questionsMessage,
            validation.message
        );


        if (questionsMessage) {

            questionsMessage.style.color =
                "red";

        }

        return;

    }


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Wird gespeichert...";

    }


    try {

        /*
         * 1. Auswertung berechnen
         */

        const result =
            calculateDevelopmentResult();


        /*
         * 2. Auswertung anzeigen
         */

        showDevelopmentResult(
            result
        );


        /*
         * 3. Auswertung in Supabase speichern
         */

        await saveDevelopmentAssessment(
            result
        );


        /*
         * 4. Erfolgsmeldung
         */

        safeText(
            questionsMessage,
            "Auswertung wurde erfolgreich erstellt und gespeichert."
        );


        if (questionsMessage) {

            questionsMessage.style.color =
                "green";

        }


        console.log(
            "Entwicklungsbewertung:",
            {

                child_id:
                    currentChildId,

                age:
                    currentAge,

                answers:
                    currentAnswers,

                result:
                    result

            }
        );

    }

    catch (error) {

        console.error(
            "Fehler bei der Entwicklungsauswertung:",
            error
        );


        safeText(
            questionsMessage,
            "Die Auswertung konnte nicht gespeichert werden."
        );


        if (questionsMessage) {

            questionsMessage.style.color =
                "red";

        }

    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Auswertung speichern";

        }

    }




}


/* ============================================================
   ENTWICKLUNG ÖFFNEN
   ============================================================ */

async function openDevelopmentSection() {

    try {

        const section =
            ensureDevelopmentSection();


        if (!section) {
            return;
        }


        section.style.display = "";


        setupDevelopmentEvents();


        populateDevelopmentAge();


        await loadChildrenForDevelopment();


        const {
            questionsContainer,
            questionsMessage
        } =
            getDevelopmentElements();


        if (
            questionsContainer &&
            !currentChildId
        ) {

            questionsContainer.innerHTML =
                `
                <div class="card">
                    <p>
                        Bitte ein Kind auswählen und anschließend
                        das Alter auswählen.
                    </p>
                </div>
                `;

        }


        safeText(
            questionsMessage,
            ""
        );

    }

    catch (error) {

        console.error(
            "Fehler beim Öffnen des Entwicklungskompasses:",
            error
        );

    }

}


/* ============================================================
   DASHBOARD
   ============================================================ */

function updateChildrenCount(count) {

    const element =
        byId("childrenCount");


    if (element) {

        element.textContent =
            String(count || 0);

    }

}


function updateGroupsCount(count) {

    const element =
        byId("groupsCount");


    if (element) {

        element.textContent =
            String(count || 0);

    }

}


async function updateDashboardCounts() {

    try {

        await loadChildren();

        await loadGroups();

    }

    catch (error) {

        console.error(
            "Dashboard Counts konnten nicht geladen werden:",
            error
        );

    }

}


async function handleCreateChild() {

    
    const childCode = document
        .getElementById("newChildCode")
        ?.value
        ?.trim();

    const birthDate = document
        .getElementById("newChildBirthDate")
        ?.value;

    const groupId = document
        .getElementById("newChildGroup")
        ?.value || null;
    
    const message = document.getElementById("childMessage");

    if (!childCode || !birthDate) {
        safeText(
            message,
            "Bitte Kinder-ID und Geburtsdatum eingeben."
        );
        return;
    }

    if (!currentUser) {
        safeText(message, "Du bist nicht angemeldet.");
        return;
    }

    if (!groupId) {
            safeText(
                message,
                "Bitte eine Gruppe auswählen."
            );

            message?.classList.add(
                "show",
                "error"
            );

            return;
        }

    const { error } = await supabaseClient
        .from("children")
        .insert({
            child_code: childCode,
            birth_date: birthDate,
            group_id: groupId,
            institution_id: currentProfile?.institution_id || null
        });

    


    if (error) {
        console.error("Kind konnte nicht gespeichert werden:", error);

        safeText(
            message,
            `Kind konnte nicht gespeichert werden: ${error.message}`
        );

        return;
    }

    safeText(message, "Kind wurde erfolgreich angelegt.");

    document.getElementById("newChildCode").value = "";
    document.getElementById("newChildBirthDate").value = "";
    document.getElementById("newChildGroup").value = "";

    await loadChildren();
}

/* ============================================================
   EVENTS
   ============================================================ */

function setupMainEvents() {

    const loginForm =
        byId("loginForm");


    if (
        loginForm &&
        !loginForm.dataset.eventsReady
    ) {

        loginForm.dataset.eventsReady =
            "true";

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


const createChildButton =
    document.getElementById("createChildButton");

if (
    createChildButton &&
    !createChildButton.dataset.eventsReady
) {
    createChildButton.dataset.eventsReady = "true";

    createChildButton.addEventListener(
        "click",
        handleCreateChild
    );
}
const openCreateGroupButton =
    byId("openCreateGroupButton");

if (
    openCreateGroupButton &&
    !openCreateGroupButton.dataset.eventsReady
) {
    openCreateGroupButton.dataset.eventsReady = "true";

    openCreateGroupButton.addEventListener(
        "click",
        () => {
            const modal =
                byId("createGroupModal");

            if (modal) {
                modal.style.display = "flex";
            }
        }
    );
}


const closeCreateGroupModal =
    byId("closeCreateGroupModal");

if (
    closeCreateGroupModal &&
    !closeCreateGroupModal.dataset.eventsReady
) {
    closeCreateGroupModal.dataset.eventsReady = "true";

    closeCreateGroupModal.addEventListener(
        "click",
        () => {
            const modal =
                byId("createGroupModal");

            if (modal) {
                modal.style.display = "none";
            }
        }
    );
}


    const registerForm =
        byId("registerForm");


    if (
        registerForm &&
        !registerForm.dataset.eventsReady
    ) {

        registerForm.dataset.eventsReady =
            "true";

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }


    const logoutButton =
        byId("logoutButton");


    if (
        logoutButton &&
        !logoutButton.dataset.eventsReady
    ) {

        logoutButton.dataset.eventsReady =
            "true";

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    const showRegisterButton =
        byId("showRegisterButton");


    if (
        showRegisterButton &&
        !showRegisterButton.dataset.eventsReady
    ) {

        showRegisterButton.dataset.eventsReady =
            "true";

        showRegisterButton.addEventListener(
            "click",
            () => {

                if (loginSection) {
                    loginSection.style.display =
                        "none";
                }

                if (registerSection) {
                    registerSection.style.display =
                        "";
                }

            }
        );

    }


    const showLoginButton =
        byId("showLoginButton");


    if (
        showLoginButton &&
        !showLoginButton.dataset.eventsReady
    ) {

        showLoginButton.dataset.eventsReady =
            "true";

        showLoginButton.addEventListener(
            "click",
            showLogin
        );

    }



const openCreateChildButton =
    byId("openCreateChildButton");

if (
    openCreateChildButton &&
    !openCreateChildButton.dataset.eventsReady
) {
    openCreateChildButton.dataset.eventsReady =
        "true";

    openCreateChildButton.addEventListener(
        "click",
        () => {
            const section =
                byId("createChildSection");

            if (section) {
                section.style.display = "";
            }
        }
    );
}

const cancelCreateChildButton =
    byId("cancelCreateChildButton");

if (
    cancelCreateChildButton &&
    !cancelCreateChildButton.dataset.eventsReady
) {
    cancelCreateChildButton.dataset.eventsReady =
        "true";

    cancelCreateChildButton.addEventListener(
        "click",
        () => {
            const section =
                byId("createChildSection");

            if (section) {
                section.style.display = "none";
            }

            const childCode =
                byId("newChildCode");

            const birthDate =
                byId("newChildBirthDate");

            const groupSelect =
                byId("newChildGroup");

            const ageDisplay =
                byId("newChildAgeDisplay");

            const message =
                byId("childMessage");

            if (childCode) {
                childCode.value = "";
            }

            if (birthDate) {
                birthDate.value = "";
            }

            if (groupSelect) {
                groupSelect.value = "";
            }

            if (ageDisplay) {
                ageDisplay.textContent =
                    "Bitte zuerst das Geburtsdatum eingeben.";
            }

            if (message) {
                message.textContent = "";
                message.className = "message";
            }
        }
    );
}


    setupNavigation();

}


/* ============================================================
   AUTH
   ============================================================ */

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "Auth Event:",
                event
            );


            if (session?.user) {

                currentUser =
                    session.user;


                setTimeout(
                    async () => {

                        try {

                            await loadUserProfile();

                            await initializeApplication();

                        }

                        catch (error) {

                            console.error(
                                "Auth Initialisierung:",
                                error
                            );

                        }

                    },
                    0
                );

            }

            else {

                currentUser = null;
                currentProfile = null;

                currentChildren = [];
                currentGroups = [];

                showLogin();

            }

        }
    );

}


/* ============================================================
   LOGIN PRÜFEN
   ============================================================ */

async function checkLogin() {

    if (!supabaseClient) {

        showLogin();

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session konnte nicht geladen werden:",
                error
            );

            showLogin();

            return;

        }


        if (!data?.session) {

            currentUser = null;
            currentProfile = null;

            showLogin();

            return;

        }


        currentUser =
            data.session.user;


        await loadUserProfile();


        showDashboard();


        await initializeApplication();

    }

    catch (error) {

        console.error(
            "Fehler bei checkLogin():",
            error
        );

        showLogin();

    }

}


/* ============================================================
   INITIALISIERUNG
   ============================================================ */

let applicationInitialized =
    false;


async function initializeApplication() {

    if (applicationInitialized) {

        showDashboard();

        return;

    }


    applicationInitialized =
        true;


    try {

        showDashboard();


        setupMainEvents();


        /*
         * Entwicklungskompass vorbereiten.
         */

        ensureDevelopmentSection();
       
        ensureDevelopmentResultStyles();
        
        ensureDevelopmentRatingStyles();

        setupDevelopmentEvents();

        populateDevelopmentAge();


        await loadChildren();

        await loadGroups();


        updateChildrenCount(
            currentChildren.length
        );

        updateGroupsCount(
            currentGroups.length
        );


        console.log(
            "Anwendung vollständig initialisiert."
        );

    }

    catch (error) {

        console.error(
            "Fehler bei initializeApplication():",
            error
        );

        showDashboard();

    }

}


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Kindergarten-App startet..."
        );


        showLogin();


        if (!supabaseClient) {

            console.error(
                "Supabase Client fehlt."
            );

            return;

        }


        setupMainEvents();

        setupChildBirthDate();

        setupAuthListener();

        await checkLogin();

    }
);

/* ============================================================
   NEUE ENTWICKLUNGSAUSWERTUNG
   ============================================================ */

function calculateDevelopmentResult() {
    const result = {
        total: 0,
        noch_nicht: 0,
        teilweise: 0,
        sicher: 0,
        nicht_beobachtet: 0,
        percentage: 0,
        ratedPercentage: 0,
        areas: {}
    };

    const validAnswers = [
        "noch_nicht",
        "teilweise",
        "sicher",
        "nicht_beobachtet"
    ];

    currentQuestions.forEach(question => {
        const areaDefinition =
            DEVELOPMENT_AREAS.find(
                area => area.key === question.area
            );

        if (!result.areas[question.area]) {
            result.areas[question.area] = {
                key: question.area,
                label:
                    areaDefinition?.label ||
                    question.area,
                total: 0,
                rated: 0,
                sicher: 0,
                teilweise: 0,
                noch_nicht: 0,
                nicht_beobachtet: 0,
                percentage: 0,
                ratedPercentage: 0,
                questions: []
            };
        }

        const area = result.areas[question.area];
        const answer =
            currentAnswers[question.id] ||
            currentAnswers[String(question.id)] ||
            null;

        area.total++;

        area.questions.push({
            ...question,
            answer
        });

        if (
            !answer ||
            !validAnswers.includes(answer)
        ) {
            return;
        }

        result.total++;
        result[answer]++;

        area.rated++;
        area[answer]++;
    });

    const questionCount =
        currentQuestions.length;

    result.ratedPercentage =
        questionCount > 0
            ? Math.min(
                100,
                Math.round(
                    result.total /
                    questionCount *
                    100
                )
            )
            : 0;

    const observable =
        result.total -
        result.nicht_beobachtet;

    result.percentage =
        observable > 0
            ? Math.min(
                100,
                Math.round(
                    (
                        result.sicher +
                        result.teilweise * 0.5
                    ) /
                    observable *
                    100
                )
            )
            : 0;

    Object.values(result.areas)
        .forEach(area => {
            area.ratedPercentage =
                area.total > 0
                    ? Math.min(
                        100,
                        Math.round(
                            area.rated /
                            area.total *
                            100
                        )
                    )
                    : 0;

            const areaObservable =
                area.rated -
                area.nicht_beobachtet;

            area.percentage =
                areaObservable > 0
                    ? Math.min(
                        100,
                        Math.round(
                            (
                                area.sicher +
                                area.teilweise * 0.5
                            ) /
                            areaObservable *
                            100
                        )
                    )
                    : 0;
        });

    return result;
}


/*
 * Unvollständige Auswertungen dürfen gespeichert werden.
 */
function validateDevelopment() {
    if (!currentChildId) {
        return {
            valid: false,
            message: "Bitte zuerst ein Kind auswählen."
        };
    }

    if (!currentAge) {
        return {
            valid: false,
            message: "Bitte zuerst das Alter auswählen."
        };
    }

    if (
        !currentQuestions ||
        currentQuestions.length === 0
    ) {
        return {
            valid: false,
            message:
                "Für dieses Alter sind keine Fragen vorhanden."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/* ============================================================
   AUSWERTUNG DARSTELLEN
   ============================================================ */

function showDevelopmentResult(result) {
    const {
        resultContainer
    } = getDevelopmentElements();

    if (!resultContainer) {
        return;
    }

    const areaEntries =
        Object.values(result.areas);

    const areasHtml =
        areaEntries
            .map(area => {
                const incompleteQuestions =
                    area.questions.filter(
                        question =>
                            question.answer !== "sicher"
                    );

                const detailsHtml =
                    incompleteQuestions.length > 0
                        ? incompleteQuestions
                            .map(question => {
                                const answerLabel =
                                    DEVELOPMENT_OPTIONS.find(
                                        option =>
                                            option.value ===
                                            question.answer
                                    )?.label ||
                                    "Noch nicht bewertet";

                                return `
                                    <li>
                                        <span>
                                            ${escapeHtml(
                                                question.question
                                            )}
                                        </span>
                                        <small>
                                            ${escapeHtml(
                                                answerLabel
                                            )}
                                        </small>
                                    </li>
                                `;
                            })
                            .join("")
                        : `
                            <li class="development-complete">
                                Alle Punkte sind vollständig erreicht.
                            </li>
                        `;

                return `
                    <article
                        class="development-result-area"
                    >
                        <button
                            type="button"
                            class="development-result-area-toggle"
                            aria-expanded="false"
                        >
                            <span>
                                ${escapeHtml(area.label)}
                            </span>

                            <span
                                class="development-result-circle"
                                style="
                                    --area-progress:
                                    ${area.percentage}%;
                                "
                                aria-label="Entwicklungsstand"
                            >
                                <span></span>
                            </span>
                        </button>

                        <div
                            class="
                                development-result-area-details
                            "
                            hidden
                        >
                            <h4>
                                Noch nicht vollständig erreicht
                            </h4>

                            <ul>
                                ${detailsHtml}
                            </ul>
                        </div>
                    </article>
                `;
            })
            .join("");

    resultContainer.innerHTML = `
        <div class="development-result-card">
            <h2>Auswertung</h2>

            <div class="development-result-overview">
                <span>Bereits bewertet</span>
                <strong>
                    ${result.ratedPercentage} %
                </strong>
            </div>

            <h3>Entwicklungsbereiche</h3>

            <div class="development-result-areas">
                ${areasHtml}
            </div>
        </div>
    `;

    resultContainer
        .querySelectorAll(
            ".development-result-area-toggle"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const details =
                        button.parentElement
                            .querySelector(
                                ".development-result-area-details"
                            );

                    if (!details) {
                        return;
                    }

                    const isOpen =
                        button.getAttribute(
                            "aria-expanded"
                        ) === "true";

                    button.setAttribute(
                        "aria-expanded",
                        String(!isOpen)
                    );

                    details.hidden = isOpen;
                }
            );
        });

    resultContainer.style.display = "";
}


/* ============================================================
   AUSWERTUNGS-STYLES
   ============================================================ */

function ensureDevelopmentResultStyles() {
    if (
        document.getElementById(
            "developmentResultStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "developmentResultStyles";

    style.textContent = `
        .development-result-card {
            margin-top: 30px;
            padding: 25px;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 5px 20px rgba(0, 0, 0, .08);
        }

        .development-result-card h2 {
            margin-top: 0;
        }

        .development-result-overview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 20px;
            border-radius: 16px;
            background: #f1f8f3;
            color: #237a34;
        }

        .development-result-overview span {
            font-size: 18px;
            font-weight: 600;
        }

        .development-result-overview strong {
            font-size: 32px;
        }

        .development-result-card h3 {
            margin-top: 30px;
        }

        .development-result-area {
            border-bottom: 1px solid #e5e5e5;
        }

        .development-result-area-toggle {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 18px 0;
            border: 0;
            background: transparent;
            color: inherit;
            text-align: left;
            font: inherit;
            font-weight: 700;
            font-size: 18px;
            cursor: pointer;
        }

        .development-result-area-toggle:hover {
            color: #27913a;
        }

        .development-result-circle {
            --area-progress: 0%;
            width: 54px;
            height: 54px;
            flex: 0 0 54px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background:
                conic-gradient(
                    #39b54a var(--area-progress),
                    #e5e5e5 var(--area-progress)
                );
        }

        .development-result-circle span {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #fff;
        }

        .development-result-area-details {
            padding: 0 0 18px;
            color: #555;
        }

        .development-result-area-details h4 {
            margin: 0 0 10px;
            font-size: 15px;
        }

        .development-result-area-details ul {
            display: grid;
            gap: 8px;
            margin: 0;
            padding-left: 20px;
        }

        .development-result-area-details li {
            line-height: 1.4;
        }

        .development-result-area-details small {
            display: block;
            color: #888;
        }

        .development-result-area-details
        .development-complete {
            color: #27913a;
            font-weight: 600;
        }

        @media (max-width: 600px) {
            .development-result-overview span {
                font-size: 16px;
            }

            .development-result-overview strong {
                font-size: 26px;
            }

            .development-result-area-toggle {
                font-size: 16px;
            }
        }
    `;

    document.head.appendChild(style);
}

/* ============================================================
   GUTACHTEN-AKTIONEN AKTIVIEREN
   ============================================================ */

function prepareDevelopmentReportBeforeAction() {
    if (currentDevelopmentReport) {
        return true;
    }

    if (!currentChildId) {
        safeText(
            byId("developmentReportMessage"),
            "Bitte zuerst ein Kind auswählen."
        );

        return false;
    }

    try {
        const result =
            calculateDevelopmentResult();

        currentDevelopmentReport =
            generateDevelopmentReport(result);

        showDevelopmentReport(
            currentDevelopmentReport
        );

        return true;
    }
    catch (error) {
        console.error(
            "Gutachten konnte nicht vorbereitet werden:",
            error
        );

        safeText(
            byId("developmentReportMessage"),
            "Das Gutachten konnte nicht erstellt werden."
        );

        return false;
    }
}


function enableDevelopmentReportActions() {
    const createButton =
        byId("createDevelopmentReportButton");

    const saveButton =
        byId("saveDevelopmentReportButton");

    const printButton =
        byId("printDevelopmentReportButton");

    /*
     * Die Schaltflächen dürfen nicht dauerhaft grau bleiben.
     */
    [
        createButton,
        saveButton,
        printButton
    ]
        .filter(Boolean)
        .forEach(button => {
            button.disabled = false;
            button.removeAttribute("disabled");
        });

    if (
        saveButton &&
        !saveButton.dataset.autoPrepareReady
    ) {
        saveButton.dataset.autoPrepareReady = "true";

        saveButton.addEventListener(
            "click",
            event => {
                if (
                    !prepareDevelopmentReportBeforeAction()
                ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            },
            true
        );
    }

    if (
        printButton &&
        !printButton.dataset.autoPrepareReady
    ) {
        printButton.dataset.autoPrepareReady = "true";

        printButton.addEventListener(
            "click",
            event => {
                if (
                    !prepareDevelopmentReportBeforeAction()
                ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            },
            true
        );
    }
}


/*
 * Beim Öffnen der Anwendung und nach dem Laden der Seite
 * erneut prüfen, ob die Schaltflächen vorhanden sind.
 */
document.addEventListener(
    "DOMContentLoaded",
    () => {
        enableDevelopmentReportActions();

        setTimeout(
            enableDevelopmentReportActions,
            500
        );

        setTimeout(
            enableDevelopmentReportActions,
            1500
        );
    }
);
