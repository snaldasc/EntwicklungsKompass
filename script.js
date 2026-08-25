// ============================================================
// ENTWICKLUNGSKOMPASS
// SUPABASE AUTH
// BENUTZERPROFILE
// ADMIN-FREIGABE
// KINDERVERWALTUNG
// GRUPPENVERWALTUNG
// ENTWICKLUNGSKOMPASS
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://sjekwvalxujnfparxees.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_BfusSMc15dqe3SlyxrXiFQ_Spe6Zr3r";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

if (!window.supabase) {

    console.error(
        "Supabase wurde nicht geladen."
    );

    alert(
        "Supabase konnte nicht geladen werden. Bitte überprüfe dein Supabase-Script im HTML."
    );

}


window.addEventListener("error", function (event) {
    console.error("GLOBALER JAVASCRIPT-FEHLER:", event.error || event.message);

    const loginSection = document.getElementById("loginSection");
    const appSection = document.getElementById("appSection");

    if (loginSection && appSection) {
        if (!window.currentUser) {
            loginSection.style.display = "block";
            appSection.style.display = "none";
        }
    }
});

window.addEventListener("unhandledrejection", function (event) {
    console.error("GLOBALER PROMISE-FEHLER:", event.reason);
});

// ============================================================
// GLOBALE VARIABLEN
// ============================================================

let currentUser = null;

let currentProfile = null;

let currentQuestions = [];

let currentAge = null;

let currentAnswers = {};

let authInitialized = false;


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
        "appSection"
    );


// ============================================================
// HTML ESCAPEN
// ============================================================

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


// ============================================================
// LOGIN ANZEIGEN
// ============================================================

function showLogin() {

    if (loginSection) {

        loginSection.style.display = "";

    }


    if (registerSection) {

        registerSection.style.display = "none";

    }


    if (dashboardSection) {

        dashboardSection.style.display = "none";

    }

}


// ============================================================
// REGISTRIERUNG ANZEIGEN
// ============================================================

function showRegister() {

    if (loginSection) {

        loginSection.style.display = "none";

    }


    if (registerSection) {

        registerSection.style.display = "";

    }


    if (dashboardSection) {

        dashboardSection.style.display = "none";

    }

}


// ============================================================
// DASHBOARD ANZEIGEN
// ============================================================

function showDashboard() {

    if (loginSection) {

        loginSection.style.display = "none";

    }


    if (registerSection) {

        registerSection.style.display = "none";

    }


    if (dashboardSection) {

        dashboardSection.style.display = "";

    }

}


// ============================================================
// BENUTZERPROFIL LADEN
// ============================================================

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

            showLogin();

            return null;

        }


        if (!user) {

            currentUser = null;

            currentProfile = null;

            showLogin();

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
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profil konnte nicht geladen werden:",
                error
            );

            currentProfile = null;

            showDashboard();

            showProfileError(
                "Benutzerprofil konnte nicht geladen werden."
            );

            return null;

        }


        if (!data) {

            console.warn(
                "Für diesen Benutzer existiert noch kein Profil."
            );

            currentProfile = {

                id:
                    user.id,

                institution_id:
                    null,

                full_name:
                    user.user_metadata?.full_name ||
                    user.email ||
                    "",

                phone:
                    user.user_metadata?.phone ||
                    "",

                role:
                    user.user_metadata?.role ||
                    "ELTERN",

                approval_status:
                    "PENDING",

                approved_by:
                    null,

                approved_at:
                    null,

                email:
                    user.email || ""

            };

        }

        else {

            currentProfile = {

                ...data,

                email:
                    user.email || ""

            };

        }


        updateProfileUI();

        updateUIForCurrentUser();


        return currentProfile;

    }

    catch (error) {

        console.error(
            "Fehler beim Laden des Profils:",
            error
        );

        currentProfile = null;

        showLogin();

        return null;

    }

}


// ============================================================
// PROFIL UI
// ============================================================

function updateProfileUI() {

    if (!currentProfile) {

        return;

    }


    const institutionName =
        document.getElementById(
            "institutionName"
        );


    if (institutionName) {

        institutionName.textContent =
            currentProfile.full_name ||
            "Kindergarten";

    }


    const profileName =
        document.getElementById(
            "profileName"
        );


    const profileEmail =
        document.getElementById(
            "profileEmail"
        );


    const profileRole =
        document.getElementById(
            "profileRole"
        );


    if (profileName) {

        profileName.textContent =
            currentProfile.full_name ||
            "—";

    }


    if (profileEmail) {

        profileEmail.textContent =
            currentProfile.email ||
            "—";

    }


    if (profileRole) {

        profileRole.textContent =
            currentProfile.role ||
            "—";

    }

}


// ============================================================
// PROFILFEHLER
// ============================================================

function showProfileError(message) {

    console.error(message);

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

        userName.textContent =
            currentProfile.full_name ||
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
        String(
            currentProfile.role || ""
        ).toUpperCase();


    document
        .querySelectorAll(
            "[data-role='ADMIN']"
        )
        .forEach(
            element => {

                element.style.display =
                    role === "ADMIN"
                        ? ""
                        : "none";

            }
        );


    document
        .querySelectorAll(
            "[data-role='ERZIEHER']"
        )
        .forEach(
            element => {

                element.style.display =
                    role === "ERZIEHER"
                        ? ""
                        : "none";

            }
        );


    document
        .querySelectorAll(
            "[data-role='ELTERN']"
        )
        .forEach(
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


    const role =
        String(
            currentProfile.role || ""
        ).toUpperCase();


    return (
        role === "ADMIN" ||
        role === "ERZIEHER"
    );

}


// ============================================================
// INSTITUTION PRÜFEN
// ============================================================

function hasInstitution() {

    return Boolean(
        currentProfile &&
        currentProfile.institution_id
    );

}


// ============================================================
// LOGIN PRÜFEN
// ============================================================

async function checkLogin() {

    if (!supabaseClient) {

        showLogin();

        return;

    }


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


        authInitialized = true;

    }

    catch (error) {

        console.error(
            "Fehler bei checkLogin():",
            error
        );

        showLogin();

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    if (!supabaseClient) {

        return;

    }


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

    currentAge = null;


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


            if (!supabaseClient) {

                return;

            }


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

                message.textContent = "";

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


            if (!supabaseClient) {

                return;

            }


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


            if (!email || !password) {

                if (message) {

                    message.textContent =
                        "Bitte E-Mail und Passwort eingeben.";

                }

                return;

            }


            if (password.length < 6) {

                if (message) {

                    message.textContent =
                        "Das Passwort muss mindestens 6 Zeichen enthalten.";

                }

                return;

            }


            const fullName =
                `${firstName} ${lastName}`.trim();


            if (message) {

                message.textContent =
                    "Registrierung läuft...";

            }


            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signUp({

                        email,

                        password,

                        options: {

                            data: {

                                full_name:
                                    fullName,

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

                if (data.session) {

                    message.textContent =
                        "Registrierung erfolgreich.";

                }

                else {

                    message.textContent =
                        "Registrierung erfolgreich. Bitte überprüfe deine E-Mail.";

                }

            }


            if (data.user) {

                currentUser =
                    data.user;

            }

        }
    );

}


// ============================================================
// LOGIN / REGISTRIERUNG WECHSELN
// ============================================================

const showRegisterButton =
    document.getElementById(
        "showRegisterButton"
    );


if (showRegisterButton) {

    showRegisterButton.addEventListener(
        "click",
        showRegister
    );

}


const showLoginButton =
    document.getElementById(
        "showLoginButton"
    );


if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLogin
    );

}


// ============================================================
// KINDERVERWALTUNG DOM
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
// GRUPPEN DOM
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
// KIND-MELDUNG
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
// GRUPPEN LADEN
// ============================================================

async function loadGroupsForCurrentInstitution() {

    if (!currentUser) {

        return false;

    }


    if (!currentProfile) {

        return false;

    }


    if (!hasInstitution()) {

        if (childGroupSelect) {

            childGroupSelect.innerHTML = `
                <option value="">
                    Keine Institution zugeordnet
                </option>
            `;

        }

        return false;

    }


    if (!childGroupSelect) {

        return false;

    }


    childGroupSelect.innerHTML = `
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


        childGroupSelect.innerHTML = `
            <option value="">
                Gruppen konnten nicht geladen werden
            </option>
        `;


        return false;

    }


    childGroupSelect.innerHTML = `
        <option value="">
            Gruppe auswählen...
        </option>
    `;


    if (!groups || groups.length === 0) {

        childGroupSelect.innerHTML = `
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

    if (!currentUser || !currentProfile) {

        return;

    }


    if (!childrenList) {

        return;

    }


    if (!hasInstitution()) {

        childrenList.innerHTML = `
            <p>
                Deinem Benutzer ist noch keine Institution zugeordnet.
            </p>
        `;

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
                Groups!inner (
                    id,
                    group_name,
                    institution_id
                )
            `)
            .eq(
                "Groups.institution_id",
                currentProfile.institution_id
            )
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


        childrenList.innerHTML = `
            <p style="color:red;">
                Kinder konnten nicht geladen werden.
                <br>
                ${escapeHtml(error.message)}
            </p>
        `;


        return;

    }


    if (!children || children.length === 0) {

        childrenList.innerHTML = `
            <p>
                Noch keine Kinder angelegt.
            </p>
        `;


        return;

    }


    childrenList.innerHTML = "";


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


            item.innerHTML = `
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


            childrenList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// KIND ANLEGEN – ÖFFNEN
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


            if (!hasInstitution()) {

                alert(
                    "Deinem Benutzer ist keine Institution zugeordnet."
                );

                return;

            }


            if (addChildFormContainer) {

                addChildFormContainer.style.display =
                    "block";

            }


            showChildMessage("");


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


            showChildMessage("");

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


            if (!hasInstitution()) {

                alert(
                    "Deinem Benutzer ist keine Institution zugeordnet."
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


            if (!hasInstitution()) {

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


            const oldText =
                saveNewGroupButton.textContent;


            saveNewGroupButton.textContent =
                "Wird erstellt...";


            try {

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


                if (error) {

                    throw error;

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

            catch (error) {

                console.error(
                    "Gruppe konnte nicht erstellt werden:",
                    error
                );


                showChildMessage(
                    "Gruppe konnte nicht erstellt werden: " +
                    error.message,
                    "error"
                );

            }

            finally {

                saveNewGroupButton.disabled =
                    false;

                saveNewGroupButton.textContent =
                    oldText;

            }

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


            if (!hasInstitution()) {

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


            const numericGroupId =
                Number(groupId);


            if (
                !Number.isInteger(
                    numericGroupId
                )
            ) {

                showChildMessage(
                    "Ungültige Gruppe.",
                    "error"
                );

                return;

            }


            // ==================================================
            // GRUPPE NOCHMALS PRÜFEN
            // ==================================================

            const {
                data: group,
                error: groupError
            } =
                await supabaseClient
                    .from("Groups")
                    .select(`
                        id,
                        institution_id
                    `)
                    .eq(
                        "id",
                        numericGroupId
                    )
                    .eq(
                        "institution_id",
                        currentProfile.institution_id
                    )
                    .maybeSingle();


            if (groupError) {

                console.error(
                    "Gruppe konnte nicht geprüft werden:",
                    groupError
                );


                showChildMessage(
                    "Die Gruppe konnte nicht überprüft werden.",
                    "error"
                );

                return;

            }


            if (!group) {

                showChildMessage(
                    "Die ausgewählte Gruppe gehört nicht zu deiner Institution.",
                    "error"
                );

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


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("children")
                        .insert({

                            child_code:
                                childCode,

                            group_id:
                                numericGroupId

                        })
                        .select(`
                            id,
                            child_code,
                            group_id,
                            created_at
                        `)
                        .single();


                if (error) {

                    throw error;

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


                        showChildMessage("");

                    },
                    1200
                );

            }

            catch (error) {

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

            }

            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Kind anlegen";

                }

            }

        }
    );

}


// ============================================================
// ENTWICKLUNGSKOMPASS DOM
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

const DEVELOPMENT_QUESTIONS = [

    {
        id: 1,
        area: "motorik",
        age_from: 1,
        age_to: 1,
        question:
            "Kann das Kind sicher gehen und seine Bewegungen zunehmend kontrollieren?"
    },

    {
        id: 2,
        area: "motorik",
        age_from: 2,
        age_to: 2,
        question:
            "Kann das Kind laufen, springen und einfache Bewegungsabläufe ausführen?"
    },

    {
        id: 3,
        area: "motorik",
        age_from: 3,
        age_to: 3,
        question:
            "Kann das Kind Bewegungen gezielt koordinieren und einfache motorische Aufgaben ausführen?"
    },

    {
        id: 4,
        area: "motorik",
        age_from: 4,
        age_to: 4,
        question:
            "Kann das Kind Bewegungsabläufe zunehmend sicher und koordiniert durchführen?"
    },

    {
        id: 5,
        area: "sprache",
        age_from: 1,
        age_to: 1,
        question:
            "Kann das Kind einfache Wörter oder kurze Äußerungen verwenden?"
    },

    {
        id: 6,
        area: "sprache",
        age_from: 2,
        age_to: 2,
        question:
            "Kann das Kind einfache Sätze bilden und Wünsche verständlich ausdrücken?"
    },

    {
        id: 7,
        area: "sprache",
        age_from: 3,
        age_to: 3,
        question:
            "Kann das Kind sich in einfachen Gesprächen verständlich ausdrücken?"
    },

    {
        id: 8,
        area: "sprache",
        age_from: 4,
        age_to: 4,
        question:
            "Kann das Kind Erlebnisse und Gedanken zunehmend zusammenhängend erzählen?"
    },

    {
        id: 9,
        area: "sozial",
        age_from: 1,
        age_to: 1,
        question:
            "Kann das Kind mit anderen Kindern in einfachen Situationen Kontakt aufnehmen?"
    },

    {
        id: 10,
        area: "sozial",
        age_from: 2,
        age_to: 2,
        question:
            "Kann das Kind einfache Regeln im gemeinsamen Spiel beachten?"
    },

    {
        id: 11,
        area: "sozial",
        age_from: 3,
        age_to: 3,
        question:
            "Kann das Kind eigene Gefühle zunehmend benennen und die Gefühle anderer wahrnehmen?"
    },

    {
        id: 12,
        area: "sozial",
        age_from: 4,
        age_to: 4,
        question:
            "Kann das Kind Konflikte zunehmend verbal lösen und Rücksicht auf andere nehmen?"
    },

    {
        id: 13,
        area: "kognition",
        age_from: 1,
        age_to: 1,
        question:
            "Kann das Kind einfache Zusammenhänge erkennen und bekannte Gegenstände zuordnen?"
    },

    {
        id: 14,
        area: "kognition",
        age_from: 2,
        age_to: 2,
        question:
            "Kann das Kind einfache Aufgaben nach einer kurzen Anleitung durchführen?"
    },

    {
        id: 15,
        area: "kognition",
        age_from: 3,
        age_to: 3,
        question:
            "Kann das Kind einfache Probleme selbstständig lösen und Zusammenhänge erkennen?"
    },

    {
        id: 16,
        area: "kognition",
        age_from: 4,
        age_to: 4,
        question:
            "Kann das Kind Aufgaben planen und Lösungswege zunehmend selbstständig finden?"
    },

    {
        id: 17,
        area: "selbststaendigkeit",
        age_from: 1,
        age_to: 1,
        question:
            "Kann das Kind bei einfachen Alltagshandlungen aktiv mithelfen?"
    },

    {
        id: 18,
        area: "selbststaendigkeit",
        age_from: 2,
        age_to: 2,
        question:
            "Kann das Kind einfache Alltagshandlungen zunehmend selbstständig durchführen?"
    },

    {
        id: 19,
        area: "selbststaendigkeit",
        age_from: 3,
        age_to: 3,
        question:
            "Kann das Kind einfache Aufgaben im Alltag selbstständig übernehmen?"
    },

    {
        id: 20,
        area: "selbststaendigkeit",
        age_from: 4,
        age_to: 4,
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


    if (!currentUser || !currentProfile) {

        return;

    }


    if (!hasInstitution()) {

        childSelect.innerHTML = `
            <option value="">
                Keine Institution zugeordnet
            </option>
        `;

        return;

    }


    childSelect.innerHTML = `
        <option value="">
            Kinder werden geladen...
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
                Groups!inner (
                    id,
                    group_name,
                    institution_id
                )
            `)
            .eq(
                "Groups.institution_id",
                currentProfile.institution_id
            )
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


        childSelect.innerHTML = `
            <option value="">
                Kinder konnten nicht geladen werden
            </option>
        `;


        return;

    }


    childSelect.innerHTML = `
        <option value="">
            Kind auswählen...
        </option>
    `;


    if (!children || children.length === 0) {

        childSelect.innerHTML = `
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
                String(child.id);


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


    ageSelect.innerHTML = `
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
            String(age);


        option.textContent =
            `${age} Jahre`;


        ageSelect.appendChild(
            option
        );

    }

}


// ============================================================
// FRAGEN NACH ALTER
// ============================================================

function getQuestionsForAge(age) {

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
                numericAge >= question.age_from &&
                numericAge <= question.age_to
            );

        }
    );

}


// ============================================================
// FRAGEN RENDERN
// ============================================================

function renderQuestions(questions) {

    if (!questionsContainer) {

        return;

    }


    questionsContainer.innerHTML =
        "";


    currentQuestions =
        questions || [];


    if (
        !questions ||
        questions.length === 0
    ) {

        questionsContainer.innerHTML = `
            <p>
                Für dieses Alter sind derzeit keine Fragen hinterlegt.
            </p>
        `;

        return;

    }


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
                String(question.id);


            let optionsHtml =
                "";


            DEVELOPMENT_OPTIONS.forEach(
                option => {

                    const checked =
                        currentAnswers[
                            question.id
                        ] === option.value
                            ? "checked"
                            : "";


                    optionsHtml += `
                        <label class="development-option">

                            <input
                                type="radio"
                                name="question_${question.id}"
                                value="${escapeHtml(option.value)}"
                                data-question-id="${question.id}"
                                ${checked}
                            >

                            <span>
                                ${escapeHtml(option.label)}
                            </span>

                        </label>
                    `;

                }
            );


            card.innerHTML = `
                <div class="question-number">
                    Frage ${index + 1}
                </div>

                <div class="question-area">
                    ${escapeHtml(areaLabel)}
                </div>

                <div class="question-text">
                    ${escapeHtml(question.question)}
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
        () => {

            currentAnswers = {};

            currentAge = null;


            if (ageSelect) {

                ageSelect.value =
                    "";

            }


            const resultContainer =
                document.getElementById(
                    "developmentResult"
                );


            if (resultContainer) {

                resultContainer.style.display =
                    "none";

                resultContainer.innerHTML =
                    "";

            }


            if (!childSelect.value) {

                if (questionsContainer) {

                    questionsContainer.innerHTML = `
                        <p>
                            Bitte zuerst ein Kind auswählen.
                        </p>
                    `;

                }

                currentQuestions = [];

                return;

            }


            if (questionsMessage) {

                questionsMessage.textContent =
                    "";

            }


            if (questionsContainer) {

                questionsContainer.innerHTML = `
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
                age || null;


            currentAnswers = {};


            const resultContainer =
                document.getElementById(
                    "developmentResult"
                );


            if (resultContainer) {

                resultContainer.style.display =
                    "none";

                resultContainer.innerHTML =
                    "";

            }


            if (!age) {

                currentQuestions = [];


                if (questionsContainer) {

                    questionsContainer.innerHTML = `
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


            if (!hasInstitution()) {

                showDevelopmentMessage(
                    "Deinem Benutzer ist keine Institution zugeordnet.",
                    "error"
                );

                return;

            }


            if (developmentSection) {

                developmentSection.style.display =
                    "";

            }


            await loadChildrenForDevelopment();


            populateAgeSelect();


            currentQuestions = [];

            currentAnswers = {};

            currentAge = null;


            if (questionsContainer) {

                questionsContainer.innerHTML = `
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


            const resultContainer =
                document.getElementById(
                    "developmentResult"
                );


            if (resultContainer) {

                resultContainer.style.display =
                    "none";

                resultContainer.innerHTML =
                    "";

            }


            showDevelopmentMessage("");

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


    if (unanswered.length > 0) {

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
// ENTWICKLUNGSERGEBNIS
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

function showDevelopmentResult(result) {

    const resultContainer =
        document.getElementById(
            "developmentResult"
        );


    if (!resultContainer) {

        return;

    }


    resultContainer.innerHTML = `
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
// ENTWICKLUNGSBEWERTUNG SPEICHERN
// ============================================================

async function saveDevelopmentAssessment() {

    if (!currentUser) {

        showDevelopmentMessage(
            "Du bist nicht angemeldet.",
            "error"
        );

        return false;

    }


    if (!currentProfile) {

        showDevelopmentMessage(
            "Benutzerprofil konnte nicht geladen werden.",
            "error"
        );

        return false;

    }


    if (!hasInstitution()) {

        showDevelopmentMessage(
            "Deinem Benutzer ist keine Institution zugeordnet.",
            "error"
        );

        return false;

    }


    if (!childSelect?.value) {

        showDevelopmentMessage(
            "Bitte zuerst ein Kind auswählen.",
            "error"
        );

        return false;

    }


    if (!currentAge) {

        showDevelopmentMessage(
            "Bitte zuerst das Alter auswählen.",
            "error"
        );

        return false;

    }


    const validation =
        validateDevelopmentAnswers();


    if (!validation.valid) {

        showDevelopmentMessage(
            validation.message,
            "error"
        );

        return false;

    }


    // ========================================================
    // KIND GEGEN INSTITUTION PRÜFEN
    // ========================================================

    const childId =
        Number(
            childSelect.value
        );


    if (!Number.isInteger(childId)) {

        showDevelopmentMessage(
            "Ungültiges Kind.",
            "error"
        );

        return false;

    }


    const {
        data: child,
        error: childError
    } =
        await supabaseClient
            .from("children")
            .select(`
                id,
                child_code,
                group_id,
                Groups!inner (
                    id,
                    group_name,
                    institution_id
                )
            `)
            .eq(
                "id",
                childId
            )
            .eq(
                "Groups.institution_id",
                currentProfile.institution_id
            )
            .maybeSingle();


    if (childError) {

        console.error(
            "Kind konnte nicht geprüft werden:",
            childError
        );


        showDevelopmentMessage(
            "Das ausgewählte Kind konnte nicht überprüft werden.",
            "error"
        );

        return false;

    }


    if (!child) {

        showDevelopmentMessage(
            "Das ausgewählte Kind gehört nicht zu deiner Institution.",
            "error"
        );

        return false;

    }


    const result =
        calculateDevelopmentResult();


    // ========================================================
    // ERGEBNIS SOFORT ANZEIGEN
    // ========================================================

    showDevelopmentResult(
        result
    );


    // ========================================================
    // DATENBANK-SPEICHERN
    // ========================================================

    const assessmentData = {

        institution_id:
            currentProfile.institution_id,

        child_id:
            childId,

        user_id:
            currentUser.id,

        age:
            currentAge,

        answers:
            currentAnswers,

        result:
            result

    };


    const {
        data,
        error
    } =
        await supabaseClient
            .from("development_assessments")
            .insert(
                assessmentData
            )
            .select(`
                id,
                institution_id,
                child_id,
                user_id,
                age,
                answers,
                result,
                created_at
            `)
            .single();


    if (error) {

        console.error(
            "Entwicklungsbewertung konnte nicht gespeichert werden:",
            error
        );


        showDevelopmentMessage(
            "Die Auswertung wurde berechnet, konnte aber nicht gespeichert werden: " +
            error.message,
            "error"
        );

        return false;

    }


    console.log(
        "Entwicklungsbewertung erfolgreich gespeichert:",
        data
    );


    showDevelopmentMessage(
        "Auswertung wurde erfolgreich gespeichert.",
        "success"
    );


    return true;

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
                "Wird gespeichert...";


            try {

                await saveDevelopmentAssessment();

            }

            catch (error) {

                console.error(
                    "Fehler beim Speichern der Entwicklungsbewertung:",
                    error
                );


                showDevelopmentMessage(
                    "Die Entwicklungsbewertung konnte nicht gespeichert werden.",
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
// ENTWICKLUNGSKOMPASS INITIALISIEREN
// ============================================================

async function initializeDevelopmentCompass() {

    populateAgeSelect();


    if (
        currentUser &&
        currentProfile
    ) {

        await loadChildrenForDevelopment();

    }

}


// ============================================================
// AUTH STATE CHANGE
// ============================================================

if (supabaseClient) {

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


                /*
                 * setTimeout verhindert, dass Supabase
                 * während eines Auth-Events direkt wieder
                 * einen konkurrierenden Auth-Request startet.
                 */

                setTimeout(
                    async () => {

                        await loadUserProfile();

                    },
                    0
                );

            }

            else {

                currentUser = null;

                currentProfile = null;

                currentQuestions = [];

                currentAnswers = {};

                currentAge = null;

                showLogin();

            }

        }
    );

}


// ============================================================
// INITIALISIERUNG
// ============================================================

async function initializeApplication() {

    populateAgeSelect();

    await checkLogin();

}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        {
            once: true
        }
    );

}

else {

    initializeApplication();

}
