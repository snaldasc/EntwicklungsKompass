// ============================================================
// ENTWICKLUNGSKOMPASS
// SUPABASE AUTH + BENUTZERPROFILE + ADMIN-FREIGABE
// + KINDERVERWALTUNG
// + ENTWICKLUNGSKOMPASS
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


// ============================================================
// LOGIN-ELEMENTE
// ============================================================

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const loginScreen =
    document.getElementById("loginScreen");

const appContent =
    document.getElementById("appContent");

const loginError =
    document.getElementById("loginError");


// ============================================================
// AKTUELLER BENUTZER
// ============================================================

let currentUser = null;
let currentProfile = null;
let currentInstitution = null;


// ============================================================
// AUTH-BEREICHE
// ============================================================

function hideAllAuthSections() {

    const sections = [
        "loginSection",
        "registerSection",
        "pendingSection",
        "rejectedSection",
        "emailVerificationSection"
    ];

    sections.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }
    });
}


// ============================================================
// LOGIN ANZEIGEN
// ============================================================

function showLogin() {

    hideAllAuthSections();

    const section =
        document.getElementById("loginSection");

    if (section) {
        section.style.display = "block";
    }

    if (loginError) {
        loginError.textContent = "";
    }

    const registerError =
        document.getElementById("registerError");

    if (registerError) {
        registerError.textContent = "";
    }
}


// ============================================================
// REGISTRIERUNG ANZEIGEN
// ============================================================

function showRegister() {

    hideAllAuthSections();

    const section =
        document.getElementById("registerSection");

    if (section) {
        section.style.display = "block";
    }

    if (loginError) {
        loginError.textContent = "";
    }
}


// ============================================================
// PROFIL LADEN
// ============================================================

async function loadUserProfile(userId) {

    currentProfile = null;
    currentInstitution = null;

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            full_name,
            role,
            institution_id,
            phone,
            approval_status,
            approved_by,
            approved_at
        `)
        .eq("id", userId)
        .single();


    if (profileError) {

        console.error(
            "Profil konnte nicht geladen werden:",
            profileError
        );

        return false;
    }


    if (!profile) {

        console.error(
            "Kein Profil für diesen Benutzer gefunden."
        );

        return false;
    }


    currentProfile = profile;


    // ========================================================
    // INSTITUTION LADEN
    // ========================================================

    if (profile.institution_id) {

        const {
            data: institution,
            error: institutionError
        } = await supabaseClient
            .from("institutions")
            .select(`
                id,
                name
            `)
            .eq("id", profile.institution_id)
            .single();


        if (institutionError) {

            console.warn(
                "Institution konnte nicht geladen werden:",
                institutionError
            );

        } else {

            currentInstitution =
                institution;
        }
    }

// ============================================================
// GRUPPEN DER AKTUELLEN INSTITUTION LADEN
// ============================================================

async function loadGroupsForCurrentInstitution() {

    if (!currentProfile?.institution_id) {

        console.error(
            "Keine Institution für aktuellen Benutzer gefunden."
        );

        return;
    }

    const groupSelect =
        document.getElementById("childGroup");

    if (!groupSelect) {
        return;
    }

    groupSelect.innerHTML =
        `<option value="">
            Gruppen werden geladen...
        </option>`;


    const {
        data: groups,
        error
    } = await supabaseClient

        .from("Groups")

        .select(`
            id,
            group_name,
            description
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

        groupSelect.innerHTML =
            `<option value="">
                Gruppen konnten nicht geladen werden
            </option>`;

        return;
    }


    groupSelect.innerHTML =
        `<option value="">
            Gruppe auswählen...
        </option>`;


    groups.forEach(group => {

        const option =
            document.createElement("option");

        option.value =
            group.id;

        option.textContent =
            group.group_name;

        groupSelect.appendChild(option);

    });
}
    

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
        "========================================"
    );

    console.log(
        "BENUTZERPROFIL GELADEN"
    );

    console.log(
        "Name:",
        currentProfile.full_name
    );

    console.log(
        "Rolle:",
        currentProfile.role
    );

    console.log(
        "Freigabe:",
        currentProfile.approval_status
    );

    console.log(
        "Institution:",
        currentInstitution
            ? currentInstitution.name
            : "Keine Institution"
    );

    console.log(
        "========================================"
    );


    return true;
}


// ============================================================
// BENUTZERINFO ANZEIGEN
// ============================================================

function updateUserInterface() {

    const userName =
        document.getElementById("userName");

    const userEmail =
        document.getElementById("userEmail");

    const userInstitution =
        document.getElementById("userInstitution");

    const userRole =
        document.getElementById("userRole");


    if (userName) {

        userName.textContent =
            currentProfile?.full_name ||
            "Benutzer";
    }


    if (userEmail) {

        userEmail.textContent =
            currentUser?.email ||
            "";
    }


    if (userInstitution) {

        userInstitution.textContent =
            currentInstitution?.name ||
            "Keine Institution";
    }


    if (userRole) {

        const role =
            currentProfile?.role;


        if (role === "ADMIN") {

            userRole.textContent =
                " · Administrator";

        } else if (role === "ERZIEHER") {

            userRole.textContent =
                " · Erzieher";

        } else if (role === "ELTERN") {

            userRole.textContent =
                " · Eltern";

        } else {

            userRole.textContent =
                role
                    ? " · " + role
                    : "";
        }
    }
}


// ============================================================
// AUTH-BEREICH ANZEIGEN
// ============================================================

function showAuthScreen() {

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (appContent) {
        appContent.style.display = "none";
    }
}


// ============================================================
// APP ANZEIGEN
// ============================================================
// WICHTIG: async, weil loadChildren() mit await aufgerufen wird.
// ============================================================

async function showApp() {

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (appContent) {
        appContent.style.display = "block";
    }

    updateUserInterface();

    await loadChildren();
}


// ============================================================
// PENDING ANZEIGEN
// ============================================================

function showPendingScreen() {

    showAuthScreen();

    hideAllAuthSections();

    const section =
        document.getElementById("pendingSection");

    if (section) {
        section.style.display = "block";
    }
}


// ============================================================
// REJECTED ANZEIGEN
// ============================================================

function showRejectedScreen() {

    showAuthScreen();

    hideAllAuthSections();

    const section =
        document.getElementById("rejectedSection");

    if (section) {
        section.style.display = "block";
    }
}


// ============================================================
// E-MAIL-BESTÄTIGUNG ANZEIGEN
// ============================================================

function showEmailVerificationScreen() {

    showAuthScreen();

    hideAllAuthSections();

    const section =
        document.getElementById(
            "emailVerificationSection"
        );

    if (section) {
        section.style.display = "block";
    }
}


// ============================================================
// ROLLE / FREIGABE PRÜFEN
// ============================================================

async function handleAuthenticatedUser(user) {

    if (!user) {
        return false;
    }


    currentUser = user;


    // ========================================================
    // E-MAIL BESTÄTIGT?
    // ========================================================

    if (!user.email_confirmed_at) {

        console.log(
            "E-Mail-Adresse noch nicht bestätigt."
        );

        showEmailVerificationScreen();

        return false;
    }


    // ========================================================
    // PROFIL LADEN
    // ========================================================

    const profileLoaded =
        await loadUserProfile(
            user.id
        );


    if (!profileLoaded) {

        showAuthScreen();

        hideAllAuthSections();

        showLogin();

        if (loginError) {

            loginError.textContent =
                "Für dieses Konto wurde kein Benutzerprofil gefunden.";
        }

        return false;
    }


    // ========================================================
    // FREIGABESTATUS
    // ========================================================

    const approvalStatus =
        currentProfile.approval_status;


    if (
        approvalStatus === "pending"
    ) {

        console.log(
            "Benutzer wartet auf Admin-Freigabe."
        );

        showPendingScreen();

        return false;
    }


    if (
        approvalStatus === "rejected"
    ) {

        console.log(
            "Benutzer wurde abgelehnt."
        );

        showRejectedScreen();

        return false;
    }


    if (
        approvalStatus !== "approved"
    ) {

        console.error(
            "Unbekannter Freigabestatus:",
            approvalStatus
        );

        showPendingScreen();

        return false;
    }


    // ========================================================
    // ROLLE PRÜFEN
    // ========================================================

    const role =
        currentProfile.role;


    if (
        role !== "ADMIN" &&
        role !== "ERZIEHER" &&
        role !== "ELTERN"
    ) {

        console.error(
            "Unbekannte Benutzerrolle:",
            role
        );

        showAuthScreen();

        hideAllAuthSections();

        showLogin();

        if (loginError) {

            loginError.textContent =
                "Die Benutzerrolle dieses Kontos ist ungültig.";
        }

        return false;
    }


    // ========================================================
    // APP
    // ========================================================

    await showApp();


    // ========================================================
    // ADMIN
    // ========================================================

    if (role === "ADMIN") {

        showAdminPanel();

        await loadAdminUsers();

    } else {

        hideAdminPanel();
    }


    return true;
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
// KINDER LADEN
// ============================================================

async function loadChildren() {

    if (!currentUser) {

        console.error(
            "Keine Anmeldung vorhanden."
        );

        return;
    }


    if (!childrenList) {

        console.error(
            "#childrenList wurde nicht gefunden."
        );

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
                display_name,
                created_at
            `)
            .order(
                "display_name",
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
                ${escapeHtml(error.message)}
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


            item.innerHTML =
                `
                <div>

                    <strong>
                        ${escapeHtml(
                            child.display_name ||
                            "Unbekanntes Kind"
                        )}
                    </strong>

                    <br>

                    <span>
                        Code:
                        ${escapeHtml(
                            child.child_code ||
                            "Kein Code"
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
        () => {

            if (addChildFormContainer) {

                addChildFormContainer.style.display =
                    "block";
            }


            if (childFormMessage) {

                childFormMessage.textContent =
                    "";
            }


            const nameInput =
                document.getElementById(
                    "childDisplayName"
                );


            if (nameInput) {

                nameInput.focus();
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


            if (childFormMessage) {

                childFormMessage.textContent =
                    "";
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

                if (childFormMessage) {

                    childFormMessage.textContent =
                        "Du bist nicht angemeldet.";
                }

                return;
            }


            const nameInput =
                document.getElementById(
                    "childDisplayName"
                );

            const codeInput =
                document.getElementById(
                    "childCode"
                );


            const displayName =
                nameInput
                    ? nameInput.value.trim()
                    : "";


            const childCode =
                codeInput
                    ? codeInput.value.trim()
                    : "";


            if (!displayName) {

                if (childFormMessage) {

                    childFormMessage.textContent =
                        "Bitte einen Namen eingeben.";
                }

                return;
            }


            if (childFormMessage) {

                childFormMessage.textContent =
                    "Kind wird gespeichert...";
            }


            // ==================================================
            // DATEN
            // ==================================================

            const childData = {

                display_name:
                    displayName,

                child_code:
                    childCode || null
            };


            console.log(
                "Kind wird angelegt:",
                childData
            );


            // ==================================================
            // SUPABASE INSERT
            // ==================================================

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("children")
                    .insert(
                        childData
                    )
                    .select()
                    .single();


            // ==================================================
            // FEHLER
            // ==================================================

            if (error) {

                console.error(
                    "Kind konnte nicht angelegt werden:",
                    error
                );


                if (childFormMessage) {

                    childFormMessage.innerHTML =
                        `
                        <span style="color:red;">
                            Kind konnte nicht angelegt werden:
                            ${escapeHtml(
                                error.message
                            )}
                        </span>
                        `;
                }

                return;
            }


            // ==================================================
            // ERFOLG
            // ==================================================

            console.log(
                "Kind erfolgreich angelegt:",
                data
            );


            if (childFormMessage) {

                childFormMessage.innerHTML =
                    `
                    <span style="color:green;">
                        Kind wurde erfolgreich angelegt.
                    </span>
                    `;
            }


            if (addChildForm) {

                addChildForm.reset();
            }


            // ==================================================
            // KINDER NEU LADEN
            // ==================================================

            await loadChildren();


            // ==================================================
            // FORMULAR SCHLIESSEN
            // ==================================================

            setTimeout(
                () => {

                    if (addChildFormContainer) {

                        addChildFormContainer.style.display =
                            "none";
                    }


                    if (childFormMessage) {

                        childFormMessage.textContent =
                            "";
                    }

                },
                1000
            );
        }
    );
}


// ============================================================
// LOGIN-STATUS PRÜFEN
// ============================================================

async function checkLogin() {

    try {

        const {
            data: {
                session
            }
        } =
            await supabaseClient.auth.getSession();


        if (!session) {

            currentUser = null;
            currentProfile = null;
            currentInstitution = null;

            showAuthScreen();

            showLogin();

            return;
        }


        await handleAuthenticatedUser(
            session.user
        );


    } catch (error) {

        console.error(
            "Fehler bei der Login-Prüfung:",
            error
        );

        showAuthScreen();

        showLogin();
    }
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (loginError) {
                loginError.textContent = "";
            }


            const emailElement =
                document.getElementById(
                    "loginEmail"
                );

            const passwordElement =
                document.getElementById(
                    "loginPassword"
                );


            if (
                !emailElement ||
                !passwordElement
            ) {

                if (loginError) {

                    loginError.textContent =
                        "Login-Felder wurden nicht gefunden.";
                }

                return;
            }


            const email =
                emailElement.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordElement.value;


            if (
                !email ||
                !password
            ) {

                if (loginError) {

                    loginError.textContent =
                        "Bitte E-Mail-Adresse und Passwort eingeben.";
                }

                return;
            }


            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password
                    });


            if (error) {

                console.error(
                    "Login fehlgeschlagen:",
                    error
                );


                if (loginError) {

                    if (
                        error.message
                            .toLowerCase()
                            .includes(
                                "email not confirmed"
                            )
                    ) {

                        loginError.textContent =
                            "Bitte bestätige zuerst deine E-Mail-Adresse.";

                    } else {

                        loginError.textContent =
                            "Anmeldung fehlgeschlagen: " +
                            error.message;
                    }
                }

                return;
            }


            await handleAuthenticatedUser(
                data.user
            );
        }
    );

} else {

    console.error(
        "Das Element #loginForm wurde nicht gefunden."
    );
}


// ============================================================
// REGISTRIERUNG
// ============================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const errorElement =
                document.getElementById(
                    "registerError"
                );

            const successElement =
                document.getElementById(
                    "registerSuccess"
                );


            if (errorElement) {
                errorElement.textContent = "";
            }

            if (successElement) {

                successElement.style.display =
                    "none";

                successElement.textContent =
                    "";
            }


            const nameElement =
                document.getElementById(
                    "registerName"
                );

            const emailElement =
                document.getElementById(
                    "registerEmail"
                );

            const passwordElement =
                document.getElementById(
                    "registerPassword"
                );

            const confirmElement =
                document.getElementById(
                    "registerPasswordConfirm"
                );


            if (
                !nameElement ||
                !emailElement ||
                !passwordElement ||
                !confirmElement
            ) {

                if (errorElement) {

                    errorElement.textContent =
                        "Registrierungsfelder wurden nicht gefunden.";
                }

                return;
            }


            const fullName =
                nameElement.value.trim();

            const email =
                emailElement.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordElement.value;

            const passwordConfirm =
                confirmElement.value;


            if (!fullName) {

                if (errorElement) {

                    errorElement.textContent =
                        "Bitte deinen Namen eingeben.";
                }

                return;
            }


            if (!email) {

                if (errorElement) {

                    errorElement.textContent =
                        "Bitte eine E-Mail-Adresse eingeben.";
                }

                return;
            }


            if (password.length < 6) {

                if (errorElement) {

                    errorElement.textContent =
                        "Das Passwort muss mindestens 6 Zeichen haben.";
                }

                return;
            }


            if (
                password !==
                passwordConfirm
            ) {

                if (errorElement) {

                    errorElement.textContent =
                        "Die Passwörter stimmen nicht überein.";
                }

                return;
            }


            // =================================================
            // SUPABASE AUTH BENUTZER ERSTELLEN
            // =================================================

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signUp({

                        email:
                            email,

                        password:
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


                if (errorElement) {

                    errorElement.textContent =
                        "Registrierung fehlgeschlagen: " +
                        error.message;
                }

                return;
            }


            const newUser =
                data?.user;


            if (!newUser) {

                if (errorElement) {

                    errorElement.textContent =
                        "Benutzer konnte nicht erstellt werden.";
                }

                return;
            }


            console.log(
                "Neuer Auth-Benutzer:",
                newUser.id
            );


            // =================================================
            // PROFIL ERSTELLEN
            // =================================================

            const {
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .insert({

                        id:
                            newUser.id,

                        full_name:
                            fullName,

                        role:
                            "ERZIEHER",

                        approval_status:
                            "pending"
                    });


            if (profileError) {

                console.error(
                    "Profil konnte nicht erstellt werden:",
                    profileError
                );


                if (errorElement) {

                    errorElement.textContent =
                        "Das Konto wurde erstellt, aber das Benutzerprofil konnte nicht angelegt werden. Bitte den Administrator informieren.";
                }

                return;
            }


            // =================================================
            // ERFOLG
            // =================================================

            if (successElement) {

                successElement.innerHTML =
                    `
                    <strong>
                        Registrierung erfolgreich.
                    </strong>

                    <br><br>

                    Bitte bestätige zuerst deine
                    E-Mail-Adresse.

                    Danach muss dein Konto noch von einem
                    Administrator freigegeben werden.
                    `;

                successElement.style.display =
                    "block";
            }


            registerForm.reset();


            showEmailVerificationScreen();
        }
    );

} else {

    console.warn(
        "Das Element #registerForm wurde nicht gefunden."
    );
}


// ============================================================
// AUTH-ÄNDERUNGEN ÜBERWACHEN
// ============================================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth-Event:",
            event
        );


        if (!session) {

            currentUser = null;
            currentProfile = null;
            currentInstitution = null;

            showAuthScreen();

            showLogin();

            return;
        }


        if (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION" ||
            event === "TOKEN_REFRESHED" ||
            event === "USER_UPDATED"
        ) {

            setTimeout(
                async () => {

                    await checkLogin();

                },
                0
            );
        }
    }
);


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
            "Abmeldung fehlgeschlagen:",
            error
        );

        return;
    }


    currentUser = null;
    currentProfile = null;
    currentInstitution = null;


    showAuthScreen();

    showLogin();


    if (loginError) {
        loginError.textContent = "";
    }
}


// ============================================================
// ADMIN-BEREICH
// ============================================================

function showAdminPanel() {

    const panel =
        document.getElementById(
            "adminPanel"
        );

    if (panel) {
        panel.style.display = "block";
    }
}


function hideAdminPanel() {

    const panel =
        document.getElementById(
            "adminPanel"
        );

    if (panel) {
        panel.style.display = "none";
    }
}


// ============================================================
// ADMIN-BENUTZER LADEN
// ============================================================

async function loadAdminUsers() {

    if (
        !currentProfile ||
        currentProfile.role !== "ADMIN"
    ) {

        console.warn(
            "Nur ADMIN darf Benutzer verwalten."
        );

        return;
    }


    const container =
        document.getElementById(
            "pendingUsersContainer"
        );


    if (!container) {

        console.error(
            "pendingUsersContainer wurde nicht gefunden."
        );

        return;
    }


    container.innerHTML =
        "<p>Benutzer werden geladen...</p>";


    const {
        data: users,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(`
                id,
                full_name,
                role,
                approval_status,
                created_at,
                approved_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Benutzer konnten nicht geladen werden:",
            error
        );


        container.innerHTML =
            `
            <p class="error-message">
                Benutzer konnten nicht geladen werden:
                ${escapeHtml(error.message)}
            </p>
            `;

        return;
    }


    if (
        !users ||
        users.length === 0
    ) {

        container.innerHTML =
            "<p>Keine Benutzer vorhanden.</p>";

        return;
    }


    container.innerHTML =
        "";


    users.forEach(
        user => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "admin-user-card";


            const statusText =
                getApprovalStatusText(
                    user.approval_status
                );


            card.innerHTML =
                `
                <div
                    style="
                        padding:15px;
                        margin-bottom:12px;
                        border-radius:12px;
                        background:rgba(0,0,0,0.04);
                    "
                >

                    <strong>
                        ${escapeHtml(
                            user.full_name ||
                            "Unbekannter Benutzer"
                        )}
                    </strong>

                    <br>

                    <span>
                        Rolle:
                        ${escapeHtml(
                            user.role ||
                            "Keine"
                        )}
                    </span>

                    <br>

                    <span>
                        Status:
                        ${statusText}
                    </span>

                    <br><br>

                    <label>
                        Rolle ändern:
                    </label>

                    <select
                        id="role_${user.id}"
                    >

                        <option
                            value="ERZIEHER"
                            ${
                                user.role === "ERZIEHER"
                                    ? "selected"
                                    : ""
                            }
                        >
                            ERZIEHER
                        </option>

                        <option
                            value="ELTERN"
                            ${
                                user.role === "ELTERN"
                                    ? "selected"
                                    : ""
                            }
                        >
                            ELTERN
                        </option>

                        ${
                            user.role === "ADMIN"
                                ? `
                                    <option
                                        value="ADMIN"
                                        selected
                                    >
                                        ADMIN
                                    </option>
                                  `
                                : ""
                        }

                    </select>

                    <br><br>

                    ${
                        user.approval_status === "pending"
                            ? `
                                <button
                                    type="button"
                                    onclick="approveUser('${user.id}')"
                                >
                                    Benutzer freigeben
                                </button>

                                <button
                                    type="button"
                                    onclick="rejectUser('${user.id}')"
                                >
                                    Ablehnen
                                </button>
                              `
                            : ""
                    }

                    ${
                        user.approval_status === "approved"
                            ? `
                                <button
                                    type="button"
                                    onclick="saveUserRole('${user.id}')"
                                >
                                    Rolle speichern
                                </button>

                                <button
                                    type="button"
                                    onclick="rejectUser('${user.id}')"
                                >
                                    Freigabe entziehen
                                </button>
                              `
                            : ""
                    }

                    ${
                        user.approval_status === "rejected"
                            ? `
                                <button
                                    type="button"
                                    onclick="approveUser('${user.id}')"
                                >
                                    Wieder freigeben
                                </button>
                              `
                            : ""
                    }

                </div>
                `;


            container.appendChild(
                card
            );
        }
    );
}


// ============================================================
// STATUS-TEXT
// ============================================================

function getApprovalStatusText(status) {

    if (status === "approved") {

        return "✅ Freigegeben";
    }

    if (status === "pending") {

        return "⏳ Wartet auf Freigabe";
    }

    if (status === "rejected") {

        return "❌ Abgelehnt";
    }

    return "Unbekannt";
}


// ============================================================
// ADMIN: BENUTZER FREIGEBEN
// ============================================================

async function approveUser(userId) {

    if (
        !currentProfile ||
        currentProfile.role !== "ADMIN"
    ) {

        alert(
            "Nur ein Administrator darf Benutzer freigeben."
        );

        return;
    }


    const roleElement =
        document.getElementById(
            `role_${userId}`
        );


    const selectedRole =
        roleElement
            ? roleElement.value
            : "ERZIEHER";


    if (
        selectedRole !== "ERZIEHER" &&
        selectedRole !== "ELTERN" &&
        selectedRole !== "ADMIN"
    ) {

        alert(
            "Ungültige Rolle."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({

                role:
                    selectedRole,

                approval_status:
                    "approved",

                approved_by:
                    currentUser.id,

                approved_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                userId
            );


    if (error) {

        console.error(
            "Benutzer konnte nicht freigegeben werden:",
            error
        );


        alert(
            "Benutzer konnte nicht freigegeben werden:\n\n" +
            error.message
        );

        return;
    }


    await loadAdminUsers();
}


// ============================================================
// ADMIN: BENUTZER ABLEHNEN
// ============================================================

async function rejectUser(userId) {

    if (
        !currentProfile ||
        currentProfile.role !== "ADMIN"
    ) {

        alert(
            "Nur ein Administrator darf Benutzer ablehnen."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({

                approval_status:
                    "rejected",

                approved_by:
                    currentUser.id,

                approved_at:
                    null
            })
            .eq(
                "id",
                userId
            );


    if (error) {

        console.error(
            "Benutzer konnte nicht abgelehnt werden:",
            error
        );


        alert(
            "Benutzer konnte nicht abgelehnt werden:\n\n" +
            error.message
        );

        return;
    }


    await loadAdminUsers();
}


// ============================================================
// ADMIN: ROLLE SPEICHERN
// ============================================================

async function saveUserRole(userId) {

    if (
        !currentProfile ||
        currentProfile.role !== "ADMIN"
    ) {

        alert(
            "Nur ein Administrator darf Rollen ändern."
        );

        return;
    }


    const roleElement =
        document.getElementById(
            `role_${userId}`
        );


    if (!roleElement) {
        return;
    }


    const selectedRole =
        roleElement.value;


    if (
        selectedRole !== "ADMIN" &&
        selectedRole !== "ERZIEHER" &&
        selectedRole !== "ELTERN"
    ) {

        alert(
            "Ungültige Rolle."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("profiles")
            .update({

                role:
                    selectedRole
            })
            .eq(
                "id",
                userId
            );


    if (error) {

        console.error(
            "Rolle konnte nicht gespeichert werden:",
            error
        );


        alert(
            "Rolle konnte nicht gespeichert werden:\n\n" +
            error.message
        );

        return;
    }


    await loadAdminUsers();
}


// ============================================================
// ENTWICKLUNGSKOMPASS – FRAGEN
// ============================================================

const data = {

    "1-2.5": [

        {
            name: "Sprachverständnis",

            questions: [

                "1. Das Kind versteht Nomen (Hauptwörter wie Auto, Puppe).",

                "2. Es versteht Verben (Tätigkeitswörter wie essen, trinken, gehen, turnen).",

                "3. Es versteht Präpositionen (Lagebezeichnungen wie auf, unter, neben).",

                "4. Es versteht Adjektive (Eigenschaftswörter wie groß/klein, traurig/fröhlich).",

                "5. Es versteht Aufforderungen in konkreten Situationen und setzt diese um."
            ]
        },

        {
            name: "Wortschatz/Wortbedeutung",

            questions: [

                "11. Das Kind spricht einzelne Wörter.",

                "12. Es kann bis zu 50 Wörter sprechen."
            ]
        },

        {
            name: "Lautproduktion/Lautwahrnehmung",

            questions: [

                "21. Das Kind spricht die Vokale a, e, i, o, u.",

                "22. Es produziert die Laute m, p, d, b, n."
            ]
        },

        {
            name: "Wortbildung/Satzbau",

            questions: [

                "36. Das Kind spricht Einwortsätze.",

                "37. Es spricht Zweiwortsätze."
            ]
        },

        {
            name: "Betonung",

            questions: [

                "53. Das Kind variiert die Lautstärke je nach Stimmung und Situation."
            ]
        },

        {
            name: "Verbale/nonverbale Kommunikation",

            questions: [

                "57. Das Kind sucht und hält Blickkontakt.",

                "58. Es hält Dialoge, die sich auf das unmittelbare Umfeld beziehen.",

                "59. Es ist dem Sprecher zugewandt.",

                "60. Es kann Wünsche äußern.",

                "61. Es beginnt ein Gespräch von sich aus."
            ]
        },

        {
            name: "Literacy",

            questions: [

                "73. Das Kind ist an Büchern interessiert.",

                "74. Es zeigt und benennt Dinge oder Tiere in Bilderbüchern oder ahmt sie nach."
            ]
        },

        {
            name: "Grundlegende Voraussetzungen",

            questions: [

                "83. Das Kind reagiert auf seinen Namen.",

                "84. Es zeigt emotionale Reaktionen auf ein freundliches Gesicht.",

                "85. Es hat eine gute Mundmotorik.",

                "86. Es reagiert auf Flüstern.",

                "87. Es erkennt verschiedene Geräusche und ordnet diese zu.",

                "88. Es wendet sich einer Schallquelle zu (dreht den Kopf zum Geräusch).",

                "89. Es kann eine Reihe von Wörtern nachsprechen.",

                "90. Es kann Dinge in der Nähe erkennen.",

                "91. Es kann Dinge in der Ferne erkennen.",

                "92. Es fühlt sich bei seinen Handlungen wohl.",

                "93. Es ist an seiner Umwelt interessiert.",

                "94. Es reagiert deutlich auf Interaktionsangebote."
            ]
        }
    ],


    "2.5-4.5": [

        {
            name: "Sprachverständnis",

            questions: [

                "6. Es versteht einteilige situationsgebundene Aufforderungen und setzt diese um.",

                "7. Es versteht mehrteilige Aufforderungen, die unabhängig von der jetzigen Situation sind, und setzt diese um.",

                "8. Es versteht Zeitangaben wie heute, gestern, morgen."
            ]
        },

        {
            name: "Wortschatz/Wortbedeutung",

            questions: [

                "13. Es verwendet Verben (Tätigkeitswörter, z.B. essen, laufen, schlafen).",

                "14. Es kennt und verwendet Adjektive (Eigenschaftswörter, z.B. dick, dünn, alt, jung).",

                "15. Es verwendet Präpositionen (Lagebezeichnungen, z.B. vor, auf, neben, in).",

                "16. Es benennt Farben."
            ]
        },

        {
            name: "Lautproduktion/Lautwahrnehmung",

            questions: [

                "23. Es bildet Laute w, f, l, t, ng (wie Junge), k, ch2 (wie hoch), s, z, h.",

                "24. Es spricht die Laute j, r, g, pf.",

                "25. Es produziert Konsonantenverbindungen, z.B. kl, fl, bl, gl, br, fr, gr."
            ]
        },

        {
            name: "Wortbildung/Satzbau",

            questions: [

                "38. Es verwendet Dreiwortsätze (das Verb steht am Satzende).",

                "39. Es bildet Drei- und Mehrwortsätze, wobei das Verb an der zweiten Position steht.",

                "40. Es stellt W-Fragen.",

                "41. Es verändert das Verb (Tätigkeitswort) entsprechend der Person (ich gehe, du gehst, wir gehen).",

                "42. Es verwendet Präpositionen (Verhältniswörter wie in, auf, unter) innerhalb eines Satzes richtig.",

                "43. Es verwendet Plural (Mehrzahl).",

                "44. Es verwendet Artikel (Begleiter/Geschlechtswort: der, die, das, ein, eine)."
            ]
        },

        {
            name: "Betonung",

            questions: [

                "54. Es verändert seine Tonhöhe je nach Aussage des Satzes (Frage, Aussage etc.).",

                "55. Es kann einzelne Wörter betonen/akzentuieren, um diesen eine besondere Bedeutung zu verleihen."
            ]
        },

        {
            name: "Verbale/nonverbale Kommunikation",

            questions: [

                "62. Es hält den Sprecher-Hörer-Wechsel ein.",

                "63. Es verdeutlicht sein Sprechen mit Mimik und Gestik.",

                "64. Es verwendet „ich“.",

                "65. Es spricht situationsangemessen.",

                "66. Es berücksichtigt den Zuhörer und passt seine Reaktion bzw. seine Kommunikation an sein Gegenüber an."
            ]
        },

        {
            name: "Literacy",

            questions: [

                "75. Es nimmt aktiv an einer Bilderbuchbetrachtung teil.",

                "76. Es erkennt Zusammenhänge aus Bildergeschichten und Bilderbüchern wieder.",

                "77. Es konzentriert sich über einen längeren Zeitraum auf Geschichten und Erzählungen."
            ]
        },

        {
            name: "Grundlegende Voraussetzungen",

            questions: [

                "95. Es nimmt Gefühle anderer wahr und verhält sich empathisch.",

                "96. Es kann mit Konzentration und Ausdauer bei der Sache bleiben.",

                "97. Es kann Wesentliches von Unwesentlichem unterscheiden.",

                "98. Es setzt seinen Körper entsprechend seinem Alter ein.",

                "99. Es zeigt eine gute Koordination bei komplexen Bewegungsabläufen.",

                "100. Es ist in Alltagshandlungen geschickt (z. B. zieht sich selbstständig an und aus).",

                "101. Es zeigt soziales Verhalten in der Gruppe.",

                "102. Es besitzt ein positives Selbstwertgefühl."
            ]
        }
    ],


    "4.5-6": [

        {
            name: "Sprachverständnis",

            questions: [

                "9. Es versteht Beziehungen und Auswirkungen (z.B. Es wird hell, wenn die Sonne aufgeht).",

                "10. Es versteht W-Fragen (das Kind antwortet richtig auf die ihm gestellten Fragen)."
            ]
        },

        {
            name: "Wortschatz/Wortbedeutung",

            questions: [

                "17. Es benennt Dinge genau und detailliert (z.B. Wimpern).",

                "18. Es benennt Formen (Kreis, Dreieck, Viereck).",

                "19. Es kann Oberbegriffe benennen und richtig zuordnen (Apfel = Obst).",

                "20. Es kann sich differenziert ausdrücken (z.B. Abläufe genau erklären oder beschreiben)."
            ]
        },

        {
            name: "Lautproduktion/Lautwahrnehmung",

            questions: [

                "26. Es produziert Laute ch1 (wie in ich) und sch.",

                "27. Es produziert auch schwierige Konsonantenverbindungen z.B. dr-, tr, kr, kn, sch-Verbindungen (z. B. Schmetterling, Straße, Schnecke etc.)",

                "28. Es spricht in Eins-zu-eins-Situationen deutlich, sodass es gut verstanden wird.",

                "29. Es spricht im Gruppengeschehen deutlich.",

                "30. Es erkennt Rhythmen und kann diese mitklatschen.",

                "31. Es kann Wörter in Silben zerlegen/klatschen.",

                "32. Es erkennt Reimwörter.",

                "33. Es kann Reimwörter ergänzen.",

                "34. Es unterscheidet ähnlich klingende Wörter.",

                "35. Es erkennt Anlaute."
            ]
        },

        {
            name: "Wortbildung/Satzbau",

            questions: [

                "45. Es verwendet Adjektive (Eigenschaftswörter) im Satz richtig.",

                "46. Es antwortet korrekt auf W-Fragen (Satzbau und Wortbildung sind korrekt).",

                "47. Es bildet Nebensätze, wobei das Verb im Nebensatz am Satzende steht.",

                "48. Es gibt Situationen oder Ereignisse in richtiger zeitlicher Abfolge wieder.",

                "49. Es bildet die vollendete Vergangenheit (Perfekt) richtig („Ich habe den Hund gestreichelt.“).",

                "50. Es bildet die Vergangenheitsform Präteritum (Imperfekt) richtig („Der Junge sagte zum Mädchen ...“).",

                "51. Es verwendet den Kasus Akkusativ korrekt (Wen- oder Was-Fall: „Das Mädchen isst den Apfel.“)."
            ]
        },

        {
            name: "Betonung",

            questions: [

                "56. Es ist in der Lage, einen sinnvollen Rhythmus einzuhalten."
            ]
        },

        {
            name: "Verbale/nonverbale Kommunikation",

            questions: [

                "67. Es bezieht nicht situatives Wissen mit ein.",

                "68. Es fragt nach.",

                "69. Es antwortet sinngemäß auf Fragen.",

                "70. Es hört aufmerksam zu.",

                "71. Es kann eine kurze Geschichte sinnvoll nacherzählen.",

                "72. Es beschreibt etwas Besonderes."
            ]
        },

        {
            name: "Literacy",

            questions: [

                "78. Es kann Geschichten in logischer Reihenfolge wiedergeben.",

                "79. Es versucht zu „schreiben“.",

                "80. Es interessiert sich für Schrift und versucht, Buchstaben zu schreiben.",

                "81. Es erkennt Bilder, Symbole und Piktogramme wieder, die häufig im Kindergarten verwendet werden.",

                "82. Es erkennt einzelne Buchstaben wieder."
            ]
        }
    ]
};


// ============================================================
// AKTUELLE FRAGEN
// ============================================================

let currentQuestions = [];


// ============================================================
// STATUS
// ============================================================

const STATUS_VALUES = {

    NOT_RATED: null,

    NOT_SHOWN: 0,

    PARTIAL: 50,

    FULL: 100
};


// ============================================================
// STATUS-TEXT
// ============================================================

function getStatusText(value) {

    if (value === null) {
        return "Noch nicht bewertet";
    }

    if (value === 0) {
        return "0 % – Fähigkeit wird nicht gezeigt";
    }

    if (value === 50) {
        return "50 % – Fähigkeit wird teilweise gezeigt";
    }

    if (value === 100) {
        return "100 % – Fähigkeit wird vollständig gezeigt";
    }

    return "Noch nicht bewertet";
}


// ============================================================
// STATUS-KLASSE
// ============================================================

function getStatusClass(value) {

    if (value === 0) {
        return "state-0";
    }

    if (value === 50) {
        return "state-50";
    }

    if (value === 100) {
        return "state-100";
    }

    return "";
}


// ============================================================
// STATUS AUS BOX LESEN
// ============================================================

function getBoxValue(box) {

    if (!box) {
        return null;
    }


    const rawValue =
        box.getAttribute(
            "data-value"
        );


    if (
        rawValue === null ||
        rawValue === ""
    ) {
        return null;
    }


    const value =
        Number(rawValue);


    if (
        value !== 0 &&
        value !== 50 &&
        value !== 100
    ) {
        return null;
    }


    return value;
}


// ============================================================
// ALTER BERECHNEN
// ============================================================

function calculateAgeFromBirthDate(
    birthDateString
) {

    if (!birthDateString) {
        return null;
    }


    const birthDate =
        new Date(
            birthDateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            birthDate.getTime()
        )
    ) {
        return null;
    }


    const today =
        new Date();


    let age =
        today.getFullYear() -
        birthDate.getFullYear();


    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();


    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
            birthDate.getDate()
        )
    ) {
        age--;
    }


    return age;
}


// ============================================================
// ALTER / FRAGEN LADEN
// ============================================================

function startAssessment() {

    const ageElement =
        document.getElementById(
            "ageInput"
        );

    const dobElement =
        document.getElementById(
            "dobInput"
        );


    const ageInput =
        ageElement
            ? ageElement.value.trim()
            : "";

    const dobInput =
        dobElement
            ? dobElement.value
            : "";


    let age = null;


    if (ageInput) {

        age =
            Number(
                ageInput
            );

    } else if (dobInput) {

        age =
            calculateAgeFromBirthDate(
                dobInput
            );
    }


    if (
        age === null ||
        !Number.isFinite(age) ||
        age <= 0
    ) {

        alert(
            "Bitte ein gültiges Alter oder Geburtsdatum eingeben."
        );

        return;
    }


    if (age > 6) {

        alert(
            "Der EntwicklungsKompass ist für Kinder bis 6 Jahre vorgesehen."
        );

        return;
    }


    let key;


    if (age < 2.5) {

        key =
            "1-2.5";

    } else if (age < 4.5) {

        key =
            "2.5-4.5";

    } else {

        key =
            "4.5-6";
    }


    currentQuestions =
        data[key];


    const container =
        document.getElementById(
            "questionsContainer"
        );


    if (!container) {

        console.error(
            "questionsContainer wurde nicht gefunden."
        );

        return;
    }


    container.innerHTML =
        "";


    currentQuestions.forEach(
        (
            category,
            categoryIndex
        ) => {

            const group =
                document.createElement(
                    "div"
                );


            group.className =
                "question-group";


            const heading =
                document.createElement(
                    "h3"
                );


            heading.textContent =
                category.name;


            group.appendChild(
                heading
            );


            category.questions.forEach(
                (
                    question,
                    questionIndex
                ) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "question-item";


                    const text =
                        document.createElement(
                            "span"
                        );


                    text.textContent =
                        question;


                    const box =
                        document.createElement(
                            "div"
                        );


                    box.className =
                        "checkbox-box";


                    box.id =
                        `q_${categoryIndex}_${questionIndex}`;


                    box.title =
                        "Noch nicht bewertet";


                    box.addEventListener(
                        "click",
                        () =>
                            toggleBox(box)
                    );


                    item.appendChild(
                        text
                    );

                    item.appendChild(
                        box
                    );

                    group.appendChild(
                        item
                    );
                }
            );


            container.appendChild(
                group
            );
        }
    );


    const assessmentInfo =
        document.getElementById(
            "assessmentInfo"
        );


    if (assessmentInfo) {

        assessmentInfo.textContent =
            `Alter: ${age.toFixed(1)} Jahre`;
    }


    const ageStep =
        document.getElementById(
            "step-age"
        );

    const questionStep =
        document.getElementById(
            "step-questions"
        );


    if (ageStep) {
        ageStep.classList.remove("active");
    }


    if (questionStep) {
        questionStep.classList.add("active");
    }
}


// ============================================================
// CHECKBOX / STATUS WECHSELN
// ============================================================

function toggleBox(box) {

    if (!box) {
        return;
    }


    const currentValue =
        getBoxValue(box);


    let newValue;


    if (
        currentValue === null
    ) {

        newValue =
            STATUS_VALUES.NOT_SHOWN;

    } else if (
        currentValue ===
        STATUS_VALUES.NOT_SHOWN
    ) {

        newValue =
            STATUS_VALUES.PARTIAL;

    } else if (
        currentValue ===
        STATUS_VALUES.PARTIAL
    ) {

        newValue =
            STATUS_VALUES.FULL;

    } else {

        newValue =
            STATUS_VALUES.NOT_RATED;
    }


    if (
        newValue === null
    ) {

        box.removeAttribute(
            "data-value"
        );

    } else {

        box.setAttribute(
            "data-value",
            String(newValue)
        );
    }


    box.className =
        "checkbox-box";


    const statusClass =
        getStatusClass(
            newValue
        );


    if (statusClass) {

        box.classList.add(
            statusClass
        );
    }


    box.title =
        getStatusText(
            newValue
        );
}


// ============================================================
// GUTACHTEN ERSTELLEN
// ============================================================

function generateGutachten() {

    const res =
        document.getElementById(
            "resultsContainer"
        );


    if (!res) {

        console.error(
            "resultsContainer wurde nicht gefunden."
        );

        return;
    }


    res.innerHTML =
        "";


    if (
        !currentQuestions ||
        currentQuestions.length === 0
    ) {

        res.innerHTML =
            "<p>Es wurden noch keine Fragen geladen.</p>";

        return;
    }


    let totalAll = 0;

    let countAll = 0;

    let notObservedAll = 0;


    const totalQuestions =
        currentQuestions.reduce(
            (
                sum,
                category
            ) =>
                sum +
                category.questions.length,
            0
        );


    currentQuestions.forEach(
        (
            category,
            categoryIndex
        ) => {

            let total = 0;

            let assessedCount = 0;

            let notObservedCount = 0;

            let notRatedCount = 0;

            let list = "";


            category.questions.forEach(
                (
                    question,
                    questionIndex
                ) => {

                    const box =
                        document.getElementById(
                            `q_${categoryIndex}_${questionIndex}`
                        );


                    const value =
                        getBoxValue(box);


                    if (
                        value === null
                    ) {

                        notRatedCount++;


                        list +=
                            createResultQuestion(
                                question,
                                null
                            );


                        return;
                    }


                    total +=
                        value;


                    assessedCount++;


                    totalAll +=
                        value;


                    countAll++;


                    if (
                        value ===
                        STATUS_VALUES.NOT_SHOWN
                    ) {

                        notObservedCount++;

                        notObservedAll++;
                    }


                    if (
                        value <
                        STATUS_VALUES.FULL
                    ) {

                        list +=
                            createResultQuestion(
                                question,
                                value
                            );
                    }
                }
            );


            let average = 0;


            if (
                assessedCount > 0
            ) {

                average =
                    total /
                    assessedCount;
            }


            let categoryStatus =
                "Noch nicht bewertet";


            if (
                notRatedCount === 0
            ) {

                if (
                    average === 100
                ) {

                    categoryStatus =
                        "Alles vollständig";

                } else if (
                    average === 0
                ) {

                    categoryStatus =
                        "Keine der bewerteten Fähigkeiten gezeigt";

                } else {

                    categoryStatus =
                        "Teilweise erfüllt";
                }

            } else if (
                assessedCount > 0
            ) {

                categoryStatus =
                    "Teilweise bewertet";
            }


            const size =
                assessedCount > 0
                    ? Math.max(
                        8,
                        (average / 100) * 40
                    )
                    : 8;


            res.insertAdjacentHTML(
                "beforeend",
                `

                    <div
                        class="result-item"
                        onclick="toggleResultDetails(this)"
                        style="cursor:pointer;"
                    >

                        <div>

                            <strong>
                                ${escapeHtml(
                                    category.name
                                )}
                            </strong>

                            <div
                                style="
                                    font-size:0.9em;
                                    margin-top:4px;
                                    opacity:0.75;
                                "
                            >
                                ${categoryStatus}
                            </div>

                        </div>


                        <div
                            class="circle-container"
                            title="${Math.round(
                                average
                            )} %"
                        >

                            <span
                                class="dynamic-circle"
                                style="
                                    width:${size}px;
                                    height:${size}px;
                                "
                            ></span>

                        </div>

                    </div>


                    <div
                        class="details"
                        style="display:none;"
                    >

                        <div
                            style="
                                margin-bottom:12px;
                                padding:10px;
                                border-radius:8px;
                                background:rgba(0,0,0,0.04);
                            "
                        >

                            <strong>
                                ${Math.round(
                                    average
                                )} %
                            </strong>

                            <br>

                            Bewertet:
                            ${assessedCount}
                            von
                            ${category.questions.length}

                            <br>

                            Nicht gezeigt:
                            ${notObservedCount}

                            <br>

                            Noch nicht bewertet:
                            ${notRatedCount}

                        </div>


                        <b>
                            Beobachtungsübersicht:
                        </b>


                        <ul
                            style="
                                list-style:none;
                                padding-left:0;
                                margin-top:8px;
                            "
                        >

                            ${
                                list ||
                                "<li>Alle Fähigkeiten werden vollständig gezeigt.</li>"
                            }

                        </ul>

                    </div>

                `
            );
        }
    );


    const totalNotRated =
        totalQuestions -
        countAll;


    let overallAverage = 0;


    if (
        countAll > 0
    ) {

        overallAverage =
            totalAll /
            countAll;
    }


    res.insertAdjacentHTML(
        "afterbegin",
        `

            <div
                class="overall-result"
                style="
                    margin-bottom:20px;
                    padding:15px;
                    border-radius:12px;
                    background:rgba(0,0,0,0.04);
                "
            >

                <strong>
                    Gesamtübersicht
                </strong>


                <div
                    style="
                        margin-top:8px;
                        font-size:1.1em;
                    "
                >

                    ${Math.round(
                        overallAverage
                    )} %

                </div>


                <div
                    style="
                        margin-top:6px;
                        font-size:0.9em;
                    "
                >

                    Bewertet:
                    ${countAll}
                    von
                    ${totalQuestions}

                </div>


                <div
                    style="
                        font-size:0.9em;
                    "
                >

                    Nicht gezeigt:
                    ${notObservedAll}

                </div>


                <div
                    style="
                        font-size:0.9em;
                    "
                >

                    Noch nicht bewertet:
                    ${totalNotRated}

                </div>

            </div>

        `
    );


    const questionStep =
        document.getElementById(
            "step-questions"
        );

    const resultStep =
        document.getElementById(
            "step-result"
        );


    if (questionStep) {

        questionStep.classList.remove(
            "active"
        );
    }


    if (resultStep) {

        resultStep.classList.add(
            "active"
        );
    }
}


// ============================================================
// ERGEBNIS-FRAGE ERSTELLEN
// ============================================================

function createResultQuestion(
    question,
    value
) {

    const stateClass =
        getStatusClass(
            value
        );


    const statusText =
        getStatusText(
            value
        );


    return `

        <li
            style="
                display:flex;
                align-items:flex-start;
                gap:10px;
                margin-bottom:10px;
            "
        >

            <div
                class="
                    checkbox-box
                    ${stateClass}
                "
                style="
                    width:20px;
                    height:20px;
                    min-width:20px;
                    cursor:default;
                    flex-shrink:0;
                "
                title="${statusText}"
            ></div>


            <div>

                <div>
                    ${escapeHtml(
                        question
                    )}
                </div>


                <div
                    style="
                        font-size:0.85em;
                        opacity:0.7;
                        margin-top:3px;
                    "
                >
                    ${statusText}
                </div>

            </div>

        </li>

    `;
}


// ============================================================
// HTML SICHER AUSGEBEN
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
// DETAILS EIN-/AUSBLENDEN
// ============================================================

function toggleResultDetails(
    element
) {

    if (!element) {
        return;
    }


    const details =
        element.nextElementSibling;


    if (!details) {
        return;
    }


    if (
        details.style.display ===
        "block"
    ) {

        details.style.display =
            "none";

    } else {

        details.style.display =
            "block";
    }
}


// ============================================================
// NEUE BEOBACHTUNG
// ============================================================

function startNewObservation() {

    currentQuestions = [];


    const resultStep =
        document.getElementById(
            "step-result"
        );

    const ageStep =
        document.getElementById(
            "step-age"
        );


    if (resultStep) {

        resultStep.classList.remove(
            "active"
        );
    }


    if (ageStep) {

        ageStep.classList.add(
            "active"
        );
    }


    const ageInput =
        document.getElementById(
            "ageInput"
        );

    const dobInput =
        document.getElementById(
            "dobInput"
        );


    if (ageInput) {
        ageInput.value = "";
    }

    if (dobInput) {
        dobInput.value = "";
    }
}


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
// ENDE
// ============================================================
