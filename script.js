/* ============================================================
   ENTWICKLUNGSKOMPASS
   KINDERGARTEN-VERWALTUNG
   ============================================================ */

"use strict";


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


                    if (
                        sectionName ===
                        "children"
                    ) {

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

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return [];

    }


    const childrenList =
        byId("childrenList");


    if (childrenList) {

        childrenList.innerHTML =
            "<p>Kinder werden geladen...</p>";

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("children")
            .select(`
                id,
                child_code,
                group_id,
                created_at,
                Groups (
                    id,
                    group_name
                )
            `)
            .order(
                "child_code",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Kinder konnten nicht geladen werden:",
            error
        );


        if (childrenList) {

            childrenList.innerHTML =
                `
                <p style="color:red;">
                    Kinder konnten nicht geladen werden.<br>
                    ${escapeHtml(error.message)}
                </p>
                `;

        }


        return [];

    }


    currentChildren =
        data || [];


    renderChildrenList(
        currentChildren
    );


    updateChildrenCount(
        currentChildren.length
    );


    return currentChildren;

}


function renderChildrenList(children) {

    const childrenList =
        byId("childrenList");


    if (!childrenList) {
        return;
    }


    if (
        !children ||
        children.length === 0
    ) {

        childrenList.innerHTML =
            `
            <p>
                Noch keine Kinder angelegt.
            </p>
            `;

        return;

    }


    childrenList.innerHTML = "";


    children.forEach(child => {

        const item =
            document.createElement("div");


        item.className =
            "child-item";


        const groupName =
            child.Groups?.group_name ||
            "Keine Gruppe";


        item.innerHTML =
            `
            <div>

                <strong>
                    ${escapeHtml(
                        child.child_code ||
                        "Keine Kinder-ID"
                    )}
                </strong>

                <br>

                <span>
                    Gruppe:
                    ${escapeHtml(groupName)}
                </span>

            </div>
            `;


        childrenList.appendChild(item);

    });

}


/* ============================================================
   GRUPPEN
   ============================================================ */

async function loadGroups() {

    if (!supabaseClient) {
        return [];
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("Groups")
            .select(`
                id,
                group_name,
                description,
                institution_id
            `)
            .order(
                "group_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Gruppen konnten nicht geladen werden:",
            error
        );

        return [];

    }


    currentGroups =
        data || [];


    renderGroups(
        currentGroups
    );


    updateGroupsCount(
        currentGroups.length
    );


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

    {
        id: 1,
        area: "motorik",
        age_from: 1,
        age_to: 2,
        question:
            "Kann das Kind sicher gehen und seine Bewegungen zunehmend kontrollieren?"
    },

    {
        id: 2,
        area: "sprache",
        age_from: 1,
        age_to: 2,
        question:
            "Kann das Kind einfache Wörter oder kurze Äußerungen verwenden?"
    },

    {
        id: 3,
        area: "sozial",
        age_from: 1,
        age_to: 2,
        question:
            "Kann das Kind mit anderen Kindern in einfachen Situationen Kontakt aufnehmen?"
    },

    {
        id: 4,
        area: "kognition",
        age_from: 1,
        age_to: 2,
        question:
            "Kann das Kind einfache Zusammenhänge erkennen und bekannte Gegenstände zuordnen?"
    },

    {
        id: 5,
        area: "selbststaendigkeit",
        age_from: 1,
        age_to: 2,
        question:
            "Kann das Kind bei einfachen Alltagshandlungen aktiv mithelfen?"
    },


    {
        id: 6,
        area: "motorik",
        age_from: 2,
        age_to: 3,
        question:
            "Kann das Kind laufen, springen und einfache Bewegungsabläufe ausführen?"
    },

    {
        id: 7,
        area: "sprache",
        age_from: 2,
        age_to: 3,
        question:
            "Kann das Kind einfache Sätze bilden und Wünsche verständlich ausdrücken?"
    },

    {
        id: 8,
        area: "sozial",
        age_from: 2,
        age_to: 3,
        question:
            "Kann das Kind einfache Regeln im gemeinsamen Spiel beachten?"
    },

    {
        id: 9,
        area: "kognition",
        age_from: 2,
        age_to: 3,
        question:
            "Kann das Kind einfache Aufgaben nach einer kurzen Anleitung durchführen?"
    },

    {
        id: 10,
        area: "selbststaendigkeit",
        age_from: 2,
        age_to: 3,
        question:
            "Kann das Kind einfache Alltagshandlungen zunehmend selbstständig durchführen?"
    },


    {
        id: 11,
        area: "motorik",
        age_from: 3,
        age_to: 4,
        question:
            "Kann das Kind Bewegungen gezielt koordinieren und einfache motorische Aufgaben ausführen?"
    },

    {
        id: 12,
        area: "sprache",
        age_from: 3,
        age_to: 4,
        question:
            "Kann das Kind sich in einfachen Gesprächen verständlich ausdrücken?"
    },

    {
        id: 13,
        area: "sozial",
        age_from: 3,
        age_to: 4,
        question:
            "Kann das Kind eigene Gefühle zunehmend benennen und die Gefühle anderer wahrnehmen?"
    },

    {
        id: 14,
        area: "kognition",
        age_from: 3,
        age_to: 4,
        question:
            "Kann das Kind einfache Probleme selbstständig lösen und Zusammenhänge erkennen?"
    },

    {
        id: 15,
        area: "selbststaendigkeit",
        age_from: 3,
        age_to: 4,
        question:
            "Kann das Kind einfache Aufgaben im Alltag selbstständig übernehmen?"
    },


    {
        id: 16,
        area: "motorik",
        age_from: 4,
        age_to: 5,
        question:
            "Kann das Kind Bewegungsabläufe zunehmend sicher und koordiniert durchführen?"
    },

    {
        id: 17,
        area: "sprache",
        age_from: 4,
        age_to: 5,
        question:
            "Kann das Kind Erlebnisse und Gedanken zunehmend zusammenhängend erzählen?"
    },

    {
        id: 18,
        area: "sozial",
        age_from: 4,
        age_to: 5,
        question:
            "Kann das Kind Konflikte zunehmend verbal lösen und Rücksicht auf andere nehmen?"
    },

    {
        id: 19,
        area: "kognition",
        age_from: 4,
        age_to: 5,
        question:
            "Kann das Kind Aufgaben planen und Lösungswege zunehmend selbstständig finden?"
    },

    {
        id: 20,
        area: "selbststaendigkeit",
        age_from: 4,
        age_to: 5,
        question:
            "Kann das Kind alltägliche Aufgaben weitgehend selbstständig organisieren?"
    },


    {
        id: 21,
        area: "motorik",
        age_from: 5,
        age_to: 6,
        question:
            "Kann das Kind komplexere Bewegungsabläufe sicher und koordiniert durchführen?"
    },

    {
        id: 22,
        area: "sprache",
        age_from: 5,
        age_to: 6,
        question:
            "Kann das Kind längere Erlebnisse verständlich und in sinnvoller Reihenfolge erzählen?"
    },

    {
        id: 23,
        area: "sozial",
        age_from: 5,
        age_to: 6,
        question:
            "Kann das Kind Regeln verstehen, einhalten und bei Konflikten angemessene Lösungen finden?"
    },

    {
        id: 24,
        area: "kognition",
        age_from: 5,
        age_to: 6,
        question:
            "Kann das Kind Aufgaben selbstständig planen und Lösungsstrategien entwickeln?"
    },

    {
        id: 25,
        area: "selbststaendigkeit",
        age_from: 5,
        age_to: 6,
        question:
            "Kann das Kind alltägliche Aufgaben weitgehend selbstständig durchführen?"
    },


    {
        id: 26,
        area: "motorik",
        age_from: 6,
        age_to: 7,
        question:
            "Kann das Kind koordinierte Bewegungsabläufe sicher und zielgerichtet ausführen?"
    },

    {
        id: 27,
        area: "sprache",
        age_from: 6,
        age_to: 7,
        question:
            "Kann das Kind Gedanken, Erlebnisse und Zusammenhänge ausführlich und verständlich ausdrücken?"
    },

    {
        id: 28,
        area: "sozial",
        age_from: 6,
        age_to: 7,
        question:
            "Kann das Kind Konflikte zunehmend selbstständig lösen und die Perspektive anderer berücksichtigen?"
    },

    {
        id: 29,
        area: "kognition",
        age_from: 6,
        age_to: 7,
        question:
            "Kann das Kind komplexere Aufgaben planen, bearbeiten und Lösungen überprüfen?"
    },

    {
        id: 30,
        area: "selbststaendigkeit",
        age_from: 6,
        age_to: 7,
        question:
            "Kann das Kind Verantwortung für alltägliche Aufgaben übernehmen?"
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


    section.innerHTML =
        `
        <div class="page-header">

            <h1>
                Entwicklungskompass
            </h1>

            <p>
                Entwicklungsstand eines Kindes erfassen
            </p>

        </div>


        <div class="card">

            <div class="form-group">

                <label for="developmentChild">
                    Kind
                </label>

                <select id="developmentChild">

                    <option value="">
                        Kind auswählen...
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label for="developmentAge">
                    Alter
                </label>

                <select id="developmentAge">

                    <option value="">
                        Alter auswählen...
                    </option>

                </select>

            </div>


            <div
                id="questionsMessage"
                class="message"
            ></div>


            <div
                id="questionsContainer"
            ></div>


            <div
                id="developmentResult"
                style="display:none;"
            ></div>


            <button
                type="button"
                class="btn btn-success"
                id="saveDevelopmentButton"
            >
                Auswertung erstellen
            </button>

        </div>
        `;


    setupDevelopmentEvents();

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

function handleDevelopmentChildChange(event) {

    currentChildId =
        event.target.value ||
        null;


    currentAnswers = {};

    currentQuestions = [];

    currentAge = null;


    const {
        questionsContainer,
        questionsMessage,
        ageSelect,
        resultContainer
    } =
        getDevelopmentElements();


    if (ageSelect) {
        ageSelect.value = "";
    }


    if (resultContainer) {

        resultContainer.style.display =
            "none";

        resultContainer.innerHTML = "";

    }


    if (!currentChildId) {

        if (questionsContainer) {

            questionsContainer.innerHTML =
                `
                <p>
                    Bitte zuerst ein Kind auswählen.
                </p>
                `;

        }

        return;

    }


    safeText(
        questionsMessage,
        ""
    );


    if (questionsContainer) {

        questionsContainer.innerHTML =
            `
            <p>
                Jetzt bitte das Alter auswählen.
            </p>
            `;

    }

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

    /*
     * WICHTIG:
     * Hier müssen die Klammern stehen.
     */

    ensureDevelopmentRatingStyles();


    const {
        childSelect,
        ageSelect,
        saveButton
    } =
        getDevelopmentElements();


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

        total:0,

        noch_nicht:0,

        teilweise:0,

        sicher:0,

        nicht_beobachtet:0,

        percentage:0

    };


    currentQuestions.forEach(question => {

        const answer =
            currentAnswers[
                question.id
            ];


        if (!answer) {
            return;
        }


        result.total++;


        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    result,
                    answer
                )
        ) {

            result[answer]++;

        }

    });


    const observable =
        result.total -
        result.nicht_beobachtet;


    if (
        observable > 0
    ) {

        result.percentage =
            Math.round(
                (
                    result.sicher /
                    observable
                ) *
                100
            );

    }


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


    resultContainer.innerHTML =
        `
        <div class="development-result-card">

            <h2>
                Auswertung
            </h2>


            <div class="development-result-row">

                <span>
                    Sicher
                </span>

                <strong>
                    ${result.sicher}
                </strong>

            </div>


            <div class="development-result-row">

                <span>
                    Teilweise
                </span>

                <strong>
                    ${result.teilweise}
                </strong>

            </div>


            <div class="development-result-row">

                <span>
                    Noch nicht
                </span>

                <strong>
                    ${result.noch_nicht}
                </strong>

            </div>


            <div class="development-result-row">

                <span>
                    Nicht beobachtet
                </span>

                <strong>
                    ${result.nicht_beobachtet}
                </strong>

            </div>


            <hr>


            <div class="development-result-percentage">

                Entwicklungsstand:
                <strong>
                    ${result.percentage} %
                </strong>

            </div>

        </div>
        `;


    resultContainer.style.display = "";

}


/* ============================================================
   AUSWERTUNG ERSTELLEN
   ============================================================ */

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
            "Wird ausgewertet...";

    }


    try {

        const result =
            calculateDevelopmentResult();


        showDevelopmentResult(
            result
        );


        safeText(
            questionsMessage,
            "Auswertung erfolgreich erstellt."
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
            "Die Auswertung konnte nicht erstellt werden."
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
                "Auswertung erstellen";

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

        setupAuthListener();

        await checkLogin();

    }
);
