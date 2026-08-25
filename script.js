// ============================================================
// ENTWICKLUNGSKOMPASS
// SUPABASE AUTH + BENUTZERPROFILE + ADMIN-FREIGABE
// + KINDERVERWALTUNG
// + GRUPPENVERWALTUNG
// + ENTWICKLUNGSKOMPASS
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://sjekwvalxujnfparxees.supabase.co";        

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWt3dmFseHVqbmZwYXJ4ZWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDU5NDQsImV4cCI6MjEwMzA4MTk0NH0.xMCPzUE7BHJpYYduKoRPQ-LC6UAJJzcJWsFhik-2oZ8";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ============================================================
// GLOBALE VARIABLEN
// ============================================================

let currentUser = null;
let currentProfile = null;

let currentQuestions = [];

let currentAge = null;
let currentDob = null;

let currentAnswers = {};


// ============================================================
// DOM
// ============================================================

const loginSection =
    document.getElementById(
        "loginSection"
    );

const registerSection =
    document.getElementById(
        "registerSection"
    );

const dashboardSection =
    document.getElementById(
        "dashboardSection"
    );


// ============================================================
// HILFSFUNKTION: HTML ESCAPEN
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// ============================================================
// ANMELDUNG PRÜFEN
// ============================================================

async function checkLogin() {

    try {

        const {
            data: {
                session
            },
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


        if (!session) {

            currentUser = null;
            currentProfile = null;

            showLogin();

            return;
        }


        currentUser =
            session.user;


        await loadUserProfile();


    } catch (error) {

        console.error(
            "Fehler bei checkLogin():",
            error
        );

        showLogin();

    }
}


// ============================================================
// BENUTZERPROFIL LADEN
// ============================================================

async function loadUserProfile() {

    if (!currentUser) {

        return;

    }


    const {
        data: profile,
        error
    } =
        await supabaseClient

            .from("profiles")

            .select(`
                id,
                email,
                first_name,
                last_name,
                role,
                institution_id,
                approved,
                created_at
            `)

            .eq(
                "id",
                currentUser.id
            )

            .maybeSingle();


    if (error) {

        console.error(
            "Profil konnte nicht geladen werden:",
            error
        );

        return;
    }


    if (!profile) {

        console.error(
            "Kein Profil für Benutzer gefunden."
        );

        return;
    }


    currentProfile =
        profile;


    updateUIForCurrentUser();

}


// ============================================================
// LOGIN ANZEIGEN
// ============================================================

function showLogin() {

    if (loginSection) {

        loginSection.style.display =
            "";

    }


    if (registerSection) {

        registerSection.style.display =
            "none";

    }


    if (dashboardSection) {

        dashboardSection.style.display =
            "none";

    }

}


// ============================================================
// DASHBOARD ANZEIGEN
// ============================================================

function showDashboard() {

    if (loginSection) {

        loginSection.style.display =
            "none";

    }


    if (registerSection) {

        registerSection.style.display =
            "none";

    }


    if (dashboardSection) {

        dashboardSection.style.display =
            "";

    }

}


// ============================================================
// UI AKTUALISIEREN
// ============================================================

function updateUIForCurrentUser() {

    if (!currentUser || !currentProfile) {

        showLogin();

        return;

    }


    showDashboard();


    const userEmail =
        document.getElementById(
            "userEmail"
        );


    if (userEmail) {

        userEmail.textContent =
            currentProfile.email ||
            currentUser.email ||
            "";

    }


    const userName =
        document.getElementById(
            "userName"
        );


    if (userName) {

        const first =
            currentProfile.first_name ||
            "";

        const last =
            currentProfile.last_name ||
            "";


        const fullName =
            `${first} ${last}`.trim();


        userName.textContent =
            fullName ||
            currentProfile.email ||
            currentUser.email ||
            "";

    }


    updateRoleUI();


    loadChildren();

}


// ============================================================
// ROLLEN-UI
// ============================================================

function updateRoleUI() {

    if (!currentProfile) {

        return;

    }


    const role =
        currentProfile.role;


    const adminElements =
        document.querySelectorAll(
            "[data-role='ADMIN']"
        );


    adminElements.forEach(
        element => {

            element.style.display =
                role === "ADMIN"
                    ? ""
                    : "none";

        }
    );


    const educatorElements =
        document.querySelectorAll(
            "[data-role='ERZIEHER']"
        );


    educatorElements.forEach(
        element => {

            element.style.display =
                role === "ERZIEHER"
                    ? ""
                    : "none";

        }
    );


    const parentElements =
        document.querySelectorAll(
            "[data-role='ELTERN']"
        );


    parentElements.forEach(
        element => {

            element.style.display =
                role === "ELTERN"
                    ? ""
                    : "none";

        }
    );

}


// ============================================================
// ROLLE PRÜFEN
// ============================================================

function canManageChildren() {

    if (!currentProfile) {

        return false;

    }


    return (
        currentProfile.role ===
            "ADMIN" ||

        currentProfile.role ===
            "ERZIEHER"
    );

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Logout fehlgeschlagen:",
            error
        );

        return;

    }


    currentUser = null;

    currentProfile = null;

    currentQuestions = [];

    currentAnswers = {};


    showLogin();

}


// ============================================================
// LOGOUT BUTTON
// ============================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}


// ============================================================
// LOGIN FORMULAR
// ============================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "loginEmail"
                );


            const passwordInput =
                document.getElementById(
                    "loginPassword"
                );


            const message =
                document.getElementById(
                    "loginMessage"
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            if (!email || !password) {

                if (message) {

                    message.textContent =
                        "Bitte E-Mail und Passwort eingeben.";

                }

                return;

            }


            if (message) {

                message.textContent =
                    "Anmeldung läuft...";

            }


            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email,
                    password

                });


            if (error) {

                console.error(
                    "Login fehlgeschlagen:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message;

                }

                return;

            }


            currentUser =
                data.user;


            await loadUserProfile();


            if (message) {

                message.textContent =
                    "";

            }

        }
    );

}


// ============================================================
// REGISTRIERUNGSFORMULAR
// ============================================================

const registerForm =
    document.getElementById(
        "registerForm"
    );


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "registerEmail"
                );


            const passwordInput =
                document.getElementById(
                    "registerPassword"
                );


            const firstNameInput =
                document.getElementById(
                    "registerFirstName"
                );


            const lastNameInput =
                document.getElementById(
                    "registerLastName"
                );


            const message =
                document.getElementById(
                    "registerMessage"
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const firstName =
                firstNameInput
                    ? firstNameInput.value.trim()
                    : "";


            const lastName =
                lastNameInput
                    ? lastNameInput.value.trim()
                    : "";


            if (
                !email ||
                !password
            ) {

                if (message) {

                    message.textContent =
                        "Bitte E-Mail und Passwort eingeben.";

                }

                return;

            }


            if (message) {

                message.textContent =
                    "Registrierung läuft...";

            }


            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email,

                    password,

                    options: {

                        data: {

                            first_name:
                                firstName,

                            last_name:
                                lastName

                        }

                    }

                });


            if (error) {

                console.error(
                    "Registrierung fehlgeschlagen:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message;

                }

                return;

            }


            if (message) {

                message.textContent =
                    "Registrierung erfolgreich. Bitte überprüfe deine E-Mail.";

            }


            if (data.user) {

                currentUser =
                    data.user;

            }

        }
    );

}


// ============================================================
// ZWISCHEN LOGIN UND REGISTRIERUNG WECHSELN
// ============================================================

const showRegisterButton =
    document.getElementById(
        "showRegisterButton"
    );


if (showRegisterButton) {

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
    document.getElementById(
        "showLoginButton"
    );


if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        () => {

            if (registerSection) {

                registerSection.style.display =
                    "none";

            }


            if (loginSection) {

                loginSection.style.display =
                    "";

            }

        }
    );

}


// ============================================================
// KINDERVERWALTUNG
// ============================================================

const childrenSection =
    document.getElementById(
        "childrenSection"
    );


const showAddChildButton =
    document.getElementById(
        "showAddChildButton"
    );


const addChildFormContainer =
    document.getElementById(
        "addChildFormContainer"
    );


const addChildForm =
    document.getElementById(
        "addChildForm"
    );


const cancelAddChildButton =
    document.getElementById(
        "cancelAddChildButton"
    );


const childrenList =
    document.getElementById(
        "childrenList"
    );


const childFormMessage =
    document.getElementById(
        "childFormMessage"
    );


// ============================================================
// GRUPPEN-ELEMENTE
// ============================================================

const childGroupSelect =
    document.getElementById(
        "childGroup"
    );


const createGroupButton =
    document.getElementById(
        "createGroupButton"
    );


const newGroupContainer =
    document.getElementById(
        "newGroupContainer"
    );


const newGroupNameInput =
    document.getElementById(
        "newGroupName"
    );


const saveNewGroupButton =
    document.getElementById(
        "saveNewGroupButton"
    );


const cancelNewGroupButton =
    document.getElementById(
        "cancelNewGroupButton"
    );


// ============================================================
// KINDER-MELDUNG
// ============================================================

function showChildMessage(
    message,
    type = "info"
) {

    if (!childFormMessage) {

        return;

    }


    childFormMessage.textContent =
        message;


    if (type === "error") {

        childFormMessage.style.color =
            "red";

    }

    else if (type === "success") {

        childFormMessage.style.color =
            "green";

    }

    else {

        childFormMessage.style.color =
            "";

    }

}


// ============================================================
// GRUPPEN DER INSTITUTION LADEN
// ============================================================

async function loadGroupsForCurrentInstitution() {

    if (!currentUser) {

        console.error(
            "Kein angemeldeter Benutzer."
        );

        return false;

    }


    if (!currentProfile) {

        console.error(
            "Kein Benutzerprofil vorhanden."
        );

        return false;

    }


    if (!currentProfile.institution_id) {

        console.error(
            "Benutzer hat keine Institution."
        );


        if (childGroupSelect) {

            childGroupSelect.innerHTML =
                `
                <option value="">
                    Keine Institution zugeordnet
                </option>
                `;

        }


        return false;

    }


    if (!childGroupSelect) {

        console.error(
            "#childGroup wurde nicht gefunden."
        );

        return false;

    }


    childGroupSelect.innerHTML =
        `
        <option value="">
            Gruppen werden geladen...
        </option>
        `;


    const {
        data: groups,
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

            .eq(
                "institution_id",
                currentProfile.institution_id
            )

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


        childGroupSelect.innerHTML =
            `
            <option value="">
                Gruppen konnten nicht geladen werden
            </option>
            `;


        return false;

    }


    childGroupSelect.innerHTML =
        `
        <option value="">
            Gruppe auswählen...
        </option>
        `;


    if (
        !groups ||
        groups.length === 0
    ) {

        childGroupSelect.innerHTML =
            `
            <option value="">
                Noch keine Gruppe vorhanden
            </option>
            `;


        return true;

    }


    groups.forEach(
        group => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(group.id);


            option.textContent =
                group.group_name;


            childGroupSelect.appendChild(
                option
            );

        }
    );


    return true;

}


// ============================================================
// KINDER LADEN
// ============================================================

async function loadChildren() {

    if (!currentUser) {

        return;

    }


    if (!currentProfile) {

        return;

    }


    if (!childrenList) {

        return;

    }


    childrenList.innerHTML =
        "<p>Kinder werden geladen...</p>";


    const {
        data: children,
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


        childrenList.innerHTML =
            `
            <p style="color:red;">
                Kinder konnten nicht geladen werden.
                <br>
                ${escapeHtml(
                    error.message
                )}
            </p>
            `;


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


    childrenList.innerHTML =
        "";


    children.forEach(
        child => {

            const item =
                document.createElement(
                    "div"
                );


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
                        ${escapeHtml(
                            groupName
                        )}
                    </span>

                </div>
                `;


            childrenList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// KIND ANLEGEN – FORMULAR ÖFFNEN
// ============================================================

if (showAddChildButton) {

    showAddChildButton.addEventListener(
        "click",
        async () => {

            if (!canManageChildren()) {

                alert(
                    "Nur Administratoren und Erzieher dürfen Kinder anlegen."
                );

                return;

            }


            if (addChildFormContainer) {

                addChildFormContainer.style.display =
                    "block";

            }


            showChildMessage(
                ""
            );


            if (newGroupContainer) {

                newGroupContainer.style.display =
                    "none";

            }


            await loadGroupsForCurrentInstitution();


            const codeInput =
                document.getElementById(
                    "childCode"
                );


            if (codeInput) {

                codeInput.focus();

            }

        }
    );

}


// ============================================================
// KIND ANLEGEN – ABBRECHEN
// ============================================================

if (cancelAddChildButton) {

    cancelAddChildButton.addEventListener(
        "click",
        () => {

            if (addChildFormContainer) {

                addChildFormContainer.style.display =
                    "none";

            }


            if (addChildForm) {

                addChildForm.reset();

            }


            if (newGroupContainer) {

                newGroupContainer.style.display =
                    "none";

            }


            showChildMessage(
                ""
            );

        }
    );

}


// ============================================================
// NEUE GRUPPE ÖFFNEN
// ============================================================

if (createGroupButton) {

    createGroupButton.addEventListener(
        "click",
        () => {

            if (!canManageChildren()) {

                alert(
                    "Nur Administratoren und Erzieher dürfen Gruppen anlegen."
                );

                return;

            }


            if (newGroupContainer) {

                newGroupContainer.style.display =
                    "block";

            }


            if (newGroupNameInput) {

                newGroupNameInput.value =
                    "";

                newGroupNameInput.focus();

            }

        }
    );

}


// ============================================================
// NEUE GRUPPE ABBRECHEN
// ============================================================

if (cancelNewGroupButton) {

    cancelNewGroupButton.addEventListener(
        "click",
        () => {

            if (newGroupContainer) {

                newGroupContainer.style.display =
                    "none";

            }


            if (newGroupNameInput) {

                newGroupNameInput.value =
                    "";

            }

        }
    );

}


// ============================================================
// NEUE GRUPPE SPEICHERN
// ============================================================

if (saveNewGroupButton) {

    saveNewGroupButton.addEventListener(
        "click",
        async () => {

            if (!canManageChildren()) {

                alert(
                    "Nur Administratoren und Erzieher dürfen Gruppen anlegen."
                );

                return;

            }


            if (
                !currentProfile?.institution_id
            ) {

                showChildMessage(
                    "Deinem Benutzer ist keine Institution zugeordnet.",
                    "error"
                );

                return;

            }


            const groupName =
                newGroupNameInput
                    ? newGroupNameInput.value.trim()
                    : "";


            if (!groupName) {

                showChildMessage(
                    "Bitte einen Gruppennamen eingeben.",
                    "error"
                );

                return;

            }


            saveNewGroupButton.disabled =
                true;


            saveNewGroupButton.textContent =
                "Wird erstellt...";


            const {
                data: newGroup,
                error
            } =
                await supabaseClient

                    .from("Groups")

                    .insert({

                        group_name:
                            groupName,

                        institution_id:
                            currentProfile.institution_id

                    })

                    .select(`
                        id,
                        group_name,
                        description,
                        institution_id
                    `)

                    .single();


            saveNewGroupButton.disabled =
                false;


            saveNewGroupButton.textContent =
                "Gruppe erstellen";


            if (error) {

                console.error(
                    "Gruppe konnte nicht erstellt werden:",
                    error
                );


                showChildMessage(
                    "Gruppe konnte nicht erstellt werden: " +
                    error.message,
                    "error"
                );


                return;

            }


            await loadGroupsForCurrentInstitution();


            if (childGroupSelect) {

                childGroupSelect.value =
                    String(newGroup.id);

            }


            if (newGroupContainer) {

                newGroupContainer.style.display =
                    "none";

            }


            if (newGroupNameInput) {

                newGroupNameInput.value =
                    "";

            }


            showChildMessage(
                `Gruppe "${newGroup.group_name}" wurde erstellt.`,
                "success"
            );

        }
    );

}


// ============================================================
// KIND ANLEGEN
// ============================================================

if (addChildForm) {

    addChildForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentUser) {

                showChildMessage(
                    "Du bist nicht angemeldet.",
                    "error"
                );

                return;

            }


            if (!canManageChildren()) {

                showChildMessage(
                    "Nur Administratoren und Erzieher dürfen Kinder anlegen.",
                    "error"
                );

                return;

            }


            if (
                !currentProfile?.institution_id
            ) {

                showChildMessage(
                    "Deinem Benutzer ist keine Institution zugeordnet.",
                    "error"
                );

                return;

            }


            const codeInput =
                document.getElementById(
                    "childCode"
                );


            const childCode =
                codeInput
                    ? codeInput.value.trim()
                    : "";


            const groupId =
                childGroupSelect
                    ? childGroupSelect.value
                    : "";


            if (!childCode) {

                showChildMessage(
                    "Bitte eine Kinder-ID eingeben.",
                    "error"
                );


                if (codeInput) {

                    codeInput.focus();

                }


                return;

            }


            if (!groupId) {

                showChildMessage(
                    "Bitte eine Gruppe auswählen.",
                    "error"
                );


                if (childGroupSelect) {

                    childGroupSelect.focus();

                }


                return;

            }


            showChildMessage(
                "Kind wird gespeichert..."
            );


            const submitButton =
                addChildForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Kind wird angelegt...";

            }


            const childData = {

                child_code:
                    childCode,

                group_id:
                    Number(groupId)

            };


            const {
                data,
                error
            } =
                await supabaseClient

                    .from("children")

                    .insert(
                        childData
                    )

                    .select(`
                        id,
                        child_code,
                        group_id,
                        created_at
                    `)

                    .single();


            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Kind anlegen";

            }


            if (error) {

                console.error(
                    "Kind konnte nicht angelegt werden:",
                    error
                );


                if (
                    error.code === "23505"
                ) {

                    showChildMessage(
                        "Diese Kinder-ID existiert bereits.",
                        "error"
                    );

                }

                else {

                    showChildMessage(
                        "Kind konnte nicht angelegt werden: " +
                        error.message,
                        "error"
                    );

                }


                return;

            }


            console.log(
                "Kind erfolgreich angelegt:",
                data
            );


            showChildMessage(
                `Kind ${childCode} wurde erfolgreich angelegt.`,
                "success"
            );


            await loadChildren();


            if (addChildForm) {

                addChildForm.reset();

            }


            await loadGroupsForCurrentInstitution();


            setTimeout(
                () => {

                    if (addChildFormContainer) {

                        addChildFormContainer.style.display =
                            "none";

                    }


                    showChildMessage(
                        ""
                    );

                },
                1200
            );

        }
    );

}


// ============================================================
// AUTH STATE CHANGE
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        console.log(
            "Auth Event:",
            event
        );


        if (session) {

            currentUser =
                session.user;


            await loadUserProfile();

        }

        else {

            currentUser = null;

            currentProfile = null;

            showLogin();

        }

    }
);


// ============================================================
// INITIALISIERUNG
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkLogin();

    }
);

// ============================================================
// ENTWICKLUNGSKOMPASS
// ALTER / KINDER-AUSWAHL / FRAGEN
// ============================================================


// ============================================================
// ENTWICKLUNGSKOMPASS ELEMENTE
// ============================================================

const developmentSection =
    document.getElementById(
        "developmentSection"
    );


const childSelect =
    document.getElementById(
        "developmentChild"
    );


const ageSelect =
    document.getElementById(
        "developmentAge"
    );


const questionsContainer =
    document.getElementById(
        "questionsContainer"
    );


const questionsMessage =
    document.getElementById(
        "questionsMessage"
    );


const saveDevelopmentButton =
    document.getElementById(
        "saveDevelopmentButton"
    );


// ============================================================
// ENTWICKLUNGSBEREICHE
// ============================================================

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


// ============================================================
// FRAGEN
// ============================================================
//
// Diese Struktur ist bewusst lokal gehalten.
// Wenn deine Fragen bereits aus Supabase geladen werden,
// wird dieser Teil später durch deine echte Fragen-Tabelle
// ersetzt.
// ============================================================

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

        area: "motorik",

        age_from: 2,

        age_to: 3,

        question:
            "Kann das Kind laufen, springen und einfache Bewegungsabläufe ausführen?"
    },

    {
        id: 3,

        area: "motorik",

        age_from: 3,

        age_to: 4,

        question:
            "Kann das Kind Bewegungen gezielt koordinieren und einfache motorische Aufgaben ausführen?"
    },

    {
        id: 4,

        area: "motorik",

        age_from: 4,

        age_to: 5,

        question:
            "Kann das Kind Bewegungsabläufe zunehmend sicher und koordiniert durchführen?"
    },

    {
        id: 5,

        area: "sprache",

        age_from: 1,

        age_to: 2,

        question:
            "Kann das Kind einfache Wörter oder kurze Äußerungen verwenden?"
    },

    {
        id: 6,

        area: "sprache",

        age_from: 2,

        age_to: 3,

        question:
            "Kann das Kind einfache Sätze bilden und Wünsche verständlich ausdrücken?"
    },

    {
        id: 7,

        area: "sprache",

        age_from: 3,

        age_to: 4,

        question:
            "Kann das Kind sich in einfachen Gesprächen verständlich ausdrücken?"
    },

    {
        id: 8,

        area: "sprache",

        age_from: 4,

        age_to: 5,

        question:
            "Kann das Kind Erlebnisse und Gedanken zunehmend zusammenhängend erzählen?"
    },

    {
        id: 9,

        area: "sozial",

        age_from: 1,

        age_to: 2,

        question:
            "Kann das Kind mit anderen Kindern in einfachen Situationen Kontakt aufnehmen?"
    },

    {
        id: 10,

        area: "sozial",

        age_from: 2,

        age_to: 3,

        question:
            "Kann das Kind einfache Regeln im gemeinsamen Spiel beachten?"
    },

    {
        id: 11,

        area: "sozial",

        age_from: 3,

        age_to: 4,

        question:
            "Kann das Kind eigene Gefühle zunehmend benennen und die Gefühle anderer wahrnehmen?"
    },

    {
        id: 12,

        area: "sozial",

        age_from: 4,

        age_to: 5,

        question:
            "Kann das Kind Konflikte zunehmend verbal lösen und Rücksicht auf andere nehmen?"
    },

    {
        id: 13,

        area: "kognition",

        age_from: 1,

        age_to: 2,

        question:
            "Kann das Kind einfache Zusammenhänge erkennen und bekannte Gegenstände zuordnen?"
    },

    {
        id: 14,

        area: "kognition",

        age_from: 2,

        age_to: 3,

        question:
            "Kann das Kind einfache Aufgaben nach einer kurzen Anleitung durchführen?"
    },

    {
        id: 15,

        area: "kognition",

        age_from: 3,

        age_to: 4,

        question:
            "Kann das Kind einfache Probleme selbstständig lösen und Zusammenhänge erkennen?"
    },

    {
        id: 16,

        area: "kognition",

        age_from: 4,

        age_to: 5,

        question:
            "Kann das Kind Aufgaben planen und Lösungswege zunehmend selbstständig finden?"
    },

    {
        id: 17,

        area: "selbststaendigkeit",

        age_from: 1,

        age_to: 2,

        question:
            "Kann das Kind bei einfachen Alltagshandlungen aktiv mithelfen?"
    },

    {
        id: 18,

        area: "selbststaendigkeit",

        age_from: 2,

        age_to: 3,

        question:
            "Kann das Kind einfache Alltagshandlungen zunehmend selbstständig durchführen?"
    },

    {
        id: 19,

        area: "selbststaendigkeit",

        age_from: 3,

        age_to: 4,

        question:
            "Kann das Kind einfache Aufgaben im Alltag selbstständig übernehmen?"
    },

    {
        id: 20,

        area: "selbststaendigkeit",

        age_from: 4,

        age_to: 5,

        question:
            "Kann das Kind alltägliche Aufgaben weitgehend selbstständig organisieren?"
    }

];


// ============================================================
// BEWERTUNGSOPTIONEN
// ============================================================

const DEVELOPMENT_OPTIONS = [

    {
        value: "noch_nicht",
        label: "Noch nicht"
    },

    {
        value: "teilweise",
        label: "Teilweise"
    },

    {
        value: "sicher",
        label: "Sicher"
    },

    {
        value: "nicht_beobachtet",
        label: "Nicht beobachtet"
    }

];


// ============================================================
// KINDER FÜR ENTWICKLUNGSKOMPASS LADEN
// ============================================================

async function loadChildrenForDevelopment() {

    if (!childSelect) {

        return;

    }


    if (!currentUser) {

        return;

    }


    childSelect.innerHTML =
        `
        <option value="">
            Kind auswählen...
        </option>
        `;


    const {
        data: children,
        error
    } =
        await supabaseClient

            .from("children")

            .select(`
                id,
                child_code,
                group_id,
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
            "Kinder für Entwicklungskompass konnten nicht geladen werden:",
            error
        );


        childSelect.innerHTML =
            `
            <option value="">
                Kinder konnten nicht geladen werden
            </option>
            `;


        return;

    }


    if (
        !children ||
        children.length === 0
    ) {

        childSelect.innerHTML =
            `
            <option value="">
                Noch keine Kinder vorhanden
            </option>
            `;


        return;

    }


    children.forEach(
        child => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                child.id;


            const groupName =
                child.Groups?.group_name ||
                "Keine Gruppe";


            option.textContent =
                `${child.child_code} – ${groupName}`;


            childSelect.appendChild(
                option
            );

        }
    );

}


// ============================================================
// ALTER LADEN
// ============================================================

function populateAgeSelect() {

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
            document.createElement(
                "option"
            );


        option.value =
            age;


        option.textContent =
            `${age} Jahre`;


        ageSelect.appendChild(
            option
        );

    }

}


// ============================================================
// FRAGEN NACH ALTER LADEN
// ============================================================

function getQuestionsForAge(
    age
) {

    const numericAge =
        Number(age);


    if (
        !numericAge ||
        Number.isNaN(numericAge)
    ) {

        return [];

    }


    return DEVELOPMENT_QUESTIONS.filter(
        question => {

            return (
                numericAge >=
                    question.age_from &&

                numericAge <=
                    question.age_to
            );

        }
    );

}


// ============================================================
// FRAGEN RENDERN
// ============================================================

function renderQuestions(
    questions
) {

    if (!questionsContainer) {

        return;

    }


    questionsContainer.innerHTML =
        "";


    if (
        !questions ||
        questions.length === 0
    ) {

        questionsContainer.innerHTML =
            `
            <p>
                Für dieses Alter sind derzeit
                keine Fragen hinterlegt.
            </p>
            `;


        return;

    }


    currentQuestions =
        questions;


    questions.forEach(
        (
            question,
            index
        ) => {

            const area =
                DEVELOPMENT_AREAS.find(
                    item =>
                        item.key ===
                        question.area
                );


            const areaLabel =
                area?.label ||
                question.area;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "development-question";


            card.dataset.questionId =
                question.id;


            let optionsHtml =
                "";


            DEVELOPMENT_OPTIONS.forEach(
                option => {

                    const checked =
                        currentAnswers[
                            question.id
                        ] ===
                        option.value
                            ? "checked"
                            : "";


                    optionsHtml +=
                        `
                        <label class="development-option">

                            <input
                                type="radio"
                                name="question_${question.id}"
                                value="${escapeHtml(
                                    option.value
                                )}"
                                data-question-id="${question.id}"
                                ${checked}
                            >

                            <span>
                                ${escapeHtml(
                                    option.label
                                )}
                            </span>

                        </label>
                        `;

                }
            );


            card.innerHTML =
                `
                <div class="question-number">
                    Frage ${index + 1}
                </div>

                <div class="question-area">
                    ${escapeHtml(
                        areaLabel
                    )}
                </div>

                <div class="question-text">
                    ${escapeHtml(
                        question.question
                    )}
                </div>

                <div class="development-options">
                    ${optionsHtml}
                </div>
                `;


            questionsContainer.appendChild(
                card
            );

        }
    );


    questionsContainer
        .querySelectorAll(
            'input[type="radio"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    event => {

                        const questionId =
                            Number(
                                event.target
                                    .dataset
                                    .questionId
                            );


                        currentAnswers[
                            questionId
                        ] =
                            event.target.value;

                    }
                );

            }
        );

}


// ============================================================
// KIND AUSWÄHLEN
// ============================================================

if (childSelect) {

    childSelect.addEventListener(
        "change",
        async event => {

            const childId =
                event.target.value;


            currentAnswers = {};


            if (!childId) {

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


            if (questionsMessage) {

                questionsMessage.textContent =
                    "";

            }


            // Alter zunächst zurücksetzen

            if (ageSelect) {

                ageSelect.value =
                    "";

            }


            if (questionsContainer) {

                questionsContainer.innerHTML =
                    `
                    <p>
                        Bitte das Alter auswählen.
                    </p>
                    `;

            }

        }
    );

}


// ============================================================
// ALTER AUSWÄHLEN
// ============================================================

if (ageSelect) {

    ageSelect.addEventListener(
        "change",
        event => {

            const age =
                Number(
                    event.target.value
                );


            currentAge =
                age ||
                null;


            currentAnswers = {};


            if (!age) {

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


            const questions =
                getQuestionsForAge(
                    age
                );


            renderQuestions(
                questions
            );

        }
    );

}


// ============================================================
// ENTWICKLUNGSKOMPASS ÖFFNEN
// ============================================================

const showDevelopmentButton =
    document.getElementById(
        "showDevelopmentButton"
    );


if (showDevelopmentButton) {

    showDevelopmentButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                return;

            }


            if (developmentSection) {

                developmentSection.style.display =
                    "";

            }


            await loadChildrenForDevelopment();


            populateAgeSelect();


            if (questionsContainer) {

                questionsContainer.innerHTML =
                    `
                    <p>
                        Bitte ein Kind und anschließend
                        das Alter auswählen.
                    </p>
                    `;

            }

        }
    );

}


// ============================================================
// ENTWICKLUNGSKOMPASS SCHLIESSEN
// ============================================================

const closeDevelopmentButton =
    document.getElementById(
        "closeDevelopmentButton"
    );


if (closeDevelopmentButton) {

    closeDevelopmentButton.addEventListener(
        "click",
        () => {

            if (developmentSection) {

                developmentSection.style.display =
                    "none";

            }


            currentQuestions = [];

            currentAnswers = {};

            currentAge = null;


            if (childSelect) {

                childSelect.value =
                    "";

            }


            if (ageSelect) {

                ageSelect.value =
                    "";

            }


            if (questionsContainer) {

                questionsContainer.innerHTML =
                    "";

            }

        }
    );

}


// ============================================================
// BEWERTUNGEN PRÜFEN
// ============================================================

function validateDevelopmentAnswers() {

    if (
        !currentQuestions ||
        currentQuestions.length === 0
    ) {

        return {

            valid: false,

            message:
                "Es sind keine Fragen vorhanden."

        };

    }


    const unanswered =
        currentQuestions.filter(
            question => {

                return !currentAnswers[
                    question.id
                ];

            }
        );


    if (
        unanswered.length > 0
    ) {

        return {

            valid: false,

            message:
                `Bitte beantworte noch ${unanswered.length} Frage(n).`

        };

    }


    return {

        valid: true,

        message: ""

    };

}


// ============================================================
// ENTWICKLUNGSERGEBNIS AUSWERTEN
// ============================================================

function calculateDevelopmentResult() {

    const result = {

        total: 0,

        noch_nicht: 0,

        teilweise: 0,

        sicher: 0,

        nicht_beobachtet: 0,

        percentage: 0

    };


    currentQuestions.forEach(
        question => {

            const answer =
                currentAnswers[
                    question.id
                ];


            if (
                !answer
            ) {

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

        }
    );


    const observable =
        result.total -
        result.nicht_beobachtet;


    if (observable > 0) {

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


// ============================================================
// ERGEBNIS ANZEIGEN
// ============================================================

function showDevelopmentResult(
    result
) {

    const resultContainer =
        document.getElementById(
            "developmentResult"
        );


    if (!resultContainer) {

        return;

    }


    resultContainer.innerHTML =
        `
        <div class="development-result">

            <h3>
                Auswertung
            </h3>

            <p>
                Sicher:
                <strong>
                    ${result.sicher}
                </strong>
            </p>

            <p>
                Teilweise:
                <strong>
                    ${result.teilweise}
                </strong>
            </p>

            <p>
                Noch nicht:
                <strong>
                    ${result.noch_nicht}
                </strong>
            </p>

            <p>
                Nicht beobachtet:
                <strong>
                    ${result.nicht_beobachtet}
                </strong>
            </p>

            <p>
                Entwicklungsstand:
                <strong>
                    ${result.percentage} %
                </strong>
            </p>

        </div>
        `;


    resultContainer.style.display =
        "";

}


// ============================================================
// ENTWICKLUNGSERGEBNIS SPEICHERN
// ============================================================
//
// Dieser Teil speichert zunächst NICHT blind in eine
// nicht bestätigte Tabelle.
// Erst wenn deine konkrete Entwicklungs-Tabelle feststeht,
// wird hier der finale INSERT eingebaut.
//
// ============================================================

async function saveDevelopmentAssessment() {

    if (!currentUser) {

        showDevelopmentMessage(
            "Du bist nicht angemeldet.",
            "error"
        );

        return;

    }


    if (!childSelect?.value) {

        showDevelopmentMessage(
            "Bitte zuerst ein Kind auswählen.",
            "error"
        );

        return;

    }


    if (!currentAge) {

        showDevelopmentMessage(
            "Bitte zuerst das Alter auswählen.",
            "error"
        );

        return;

    }


    const validation =
        validateDevelopmentAnswers();


    if (!validation.valid) {

        showDevelopmentMessage(
            validation.message,
            "error"
        );

        return;

    }


    const result =
        calculateDevelopmentResult();


    showDevelopmentResult(
        result
    );


    /*
     * WICHTIG:
     *
     * Deine bisher übermittelten Supabase-Daten enthalten
     * keine bestätigte Tabelle für Entwicklungsbewertungen.
     *
     * Deshalb wird hier noch kein INSERT in eine erfundene
     * Tabelle ausgeführt.
     *
     * Die Antworten bleiben bis zum nächsten Schritt in
     * currentAnswers.
     */


    console.log(
        "Entwicklungsbewertung:",
        {

            child_id:
                childSelect.value,

            age:
                currentAge,

            answers:
                currentAnswers,

            result:
                result

        }
    );


    showDevelopmentMessage(
        "Auswertung erstellt. Die Datenbank-Speicherung wird im nächsten Schritt verbunden.",
        "success"
    );

}


// ============================================================
// ENTWICKLUNGS-MELDUNG
// ============================================================

function showDevelopmentMessage(
    message,
    type = "info"
) {

    if (!questionsMessage) {

        return;

    }


    questionsMessage.textContent =
        message;


    if (type === "error") {

        questionsMessage.style.color =
            "red";

    }

    else if (type === "success") {

        questionsMessage.style.color =
            "green";

    }

    else {

        questionsMessage.style.color =
            "";

    }

}


// ============================================================
// SPEICHERN BUTTON
// ============================================================

if (saveDevelopmentButton) {

    saveDevelopmentButton.addEventListener(
        "click",
        async () => {

            saveDevelopmentButton.disabled =
                true;


            const oldText =
                saveDevelopmentButton.textContent;


            saveDevelopmentButton.textContent =
                "Wird ausgewertet...";


            try {

                await saveDevelopmentAssessment();

            }

            catch (error) {

                console.error(
                    "Fehler beim Speichern der Entwicklungsbewertung:",
                    error
                );


                showDevelopmentMessage(
                    "Die Entwicklungsbewertung konnte nicht verarbeitet werden.",
                    "error"
                );

            }

            finally {

                saveDevelopmentButton.disabled =
                    false;


                saveDevelopmentButton.textContent =
                    oldText;

            }

        }
    );

}


// ============================================================
// KINDER NEU LADEN, WENN ENTWICKLUNGSKOMPASS SICHTBAR WIRD
// ============================================================

async function initializeDevelopmentCompass() {

    populateAgeSelect();


    if (currentUser) {

        await loadChildrenForDevelopment();

    }

}


// ============================================================
// INITIALISIERUNG ENTWICKLUNGSKOMPASS
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDevelopmentCompass
    );

}

else {

    initializeDevelopmentCompass();

}
