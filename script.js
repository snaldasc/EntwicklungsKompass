// ============================================================
// ENTWICKLUNGSKOMPASS
// SUPABASE LOGIN + BENUTZERPROFIL + ENTWICKLUNGSKOMPASS
// ============================================================


// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
    "https://sjekwvalxujnfparxees.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWt3dmFseHVqbmZwYXJ4ZWVzIiwiaWF0IjoxNzg3NTA1OTQ0LCJleHAiOjIxMDMwODE5NDl9.xMCPzUE7BHJpYYduKoRPQ-LC6UAJJzcJWsFhik-2oZ8";


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
            phone
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

            console.error(
                "Institution konnte nicht geladen werden:",
                institutionError
            );

            return false;
        }


        currentInstitution = institution;
    }


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

    const userName = document.getElementById("userName");
    const userInstitution = document.getElementById("userInstitution");
    const userRole = document.getElementById("userRole");

    if (userName) {
        userName.textContent =
            currentProfile?.full_name || "Benutzer";
    }

    if (userInstitution) {
        userInstitution.textContent =
            currentInstitution?.name || "Keine Institution";
    }

    if (userRole) {

        if (currentProfile?.role === "admin") {
            userRole.textContent = " · Administrator";

        } else if (currentProfile?.role === "teacher") {
            userRole.textContent = " · Pädagogische Fachkraft";

        } else {
            userRole.textContent =
                currentProfile?.role
                    ? " · " + currentProfile.role
                    : "";
        }
    }

    console.log(
        "Benutzeroberfläche aktualisiert:",
        userName?.textContent,
        userInstitution?.textContent,
        userRole?.textContent
    );
}

    if (userInstitution) {

        userInstitution.textContent =
            currentInstitution &&
            currentInstitution.name
                ? currentInstitution.name
                : "Keine Institution";
    }


    if (userRole) {

        let roleText =
            currentProfile &&
            currentProfile.role
                ? currentProfile.role
                : "";


        if (roleText === "admin") {

            roleText =
                " · Administrator";

        } else if (roleText === "teacher") {

            roleText =
                " · Pädagogische Fachkraft";
        }


        userRole.textContent =
            roleText;
    }
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
        } = await supabaseClient.auth.getSession();


        // ====================================================
        // NICHT EINGELOGGT
        // ====================================================

        if (!session) {

            currentUser = null;
            currentProfile = null;
            currentInstitution = null;


            if (loginScreen) {
                loginScreen.style.display = "flex";
            }


            if (appContent) {
                appContent.style.display = "none";
            }


            return;
        }


        // ====================================================
        // BENUTZER
        // ====================================================

        currentUser =
            session.user;


        // ====================================================
        // PROFIL LADEN
        // ====================================================

        const profileLoaded =
            await loadUserProfile(
                currentUser.id
            );


        if (!profileLoaded) {

            if (loginScreen) {
                loginScreen.style.display = "flex";
            }


            if (appContent) {
                appContent.style.display = "none";
            }


            if (loginError) {

                loginError.textContent =
                    "Das Benutzerprofil konnte nicht geladen werden.";
            }


            return;
        }


        // ====================================================
        // APP ANZEIGEN
        // ====================================================

        if (loginScreen) {
            loginScreen.style.display = "none";
        }


        if (appContent) {
            appContent.style.display = "block";
        }


        updateUserInterface();


    } catch (error) {

        console.error(
            "Fehler bei der Login-Prüfung:",
            error
        );


        if (loginScreen) {
            loginScreen.style.display = "flex";
        }


        if (appContent) {
            appContent.style.display = "none";
        }
    }
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

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


            if (!emailElement || !passwordElement) {

                if (loginError) {

                    loginError.textContent =
                        "Login-Felder wurden nicht gefunden.";
                }

                return;
            }


            const email =
                emailElement.value.trim();

            const password =
                passwordElement.value;


            if (!email || !password) {

                if (loginError) {

                    loginError.textContent =
                        "Bitte E-Mail-Adresse und Passwort eingeben.";
                }

                return;
            }


            const {
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                console.error(
                    "Login fehlgeschlagen:",
                    error
                );


                if (loginError) {

                    loginError.textContent =
                        "Anmeldung fehlgeschlagen: " +
                        error.message;
                }


                return;
            }


            await checkLogin();
        }
    );

} else {

    console.error(
        "Das Element #loginForm wurde nicht gefunden."
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


            if (loginScreen) {
                loginScreen.style.display = "flex";
            }


            if (appContent) {
                appContent.style.display = "none";
            }


            return;
        }


        if (
            event === "SIGNED_IN" ||
            event === "INITIAL_SESSION" ||
            event === "TOKEN_REFRESHED"
        ) {

            await checkLogin();
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


    if (loginScreen) {
        loginScreen.style.display = "flex";
    }


    if (appContent) {
        appContent.style.display = "none";
    }


    if (loginError) {
        loginError.textContent = "";
    }
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
        return "Wird nicht gezeigt";
    }

    if (value === 50) {
        return "Wird teilweise gezeigt";
    }

    if (value === 100) {
        return "Wird vollständig gezeigt";
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
            birthDateString + "T00:00:00"
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
            today.getDate() < birthDate.getDate()
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


    // ========================================================
    // ALTER DIREKT
    // ========================================================

    if (ageInput) {

        age =
            Number(
                ageInput
            );
    }


    // ========================================================
    // ALTERNATIV GEBURTSDATUM
    // ========================================================

    else if (dobInput) {

        age =
            calculateAgeFromBirthDate(
                dobInput
            );
    }


    // ========================================================
    // ALTER PRÜFEN
    // ========================================================

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


    // ========================================================
    // MAXIMALES ALTER
    // ========================================================

    if (age > 6) {

        alert(
            "Der EntwicklungsKompass ist für Kinder bis 6 Jahre vorgesehen."
        );

        return;
    }


    // ========================================================
    // ALTERSBEREICH
    // ========================================================

    let key;


    if (age < 2.5) {

        key = "1-2.5";

    } else if (age < 4.5) {

        key = "2.5-4.5";

    } else {

        key = "4.5-6";
    }


    currentQuestions =
        data[key];


    // ========================================================
    // FRAGEN-CONTAINER
    // ========================================================

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


    container.innerHTML = "";


    // ========================================================
    // FRAGEN ERSTELLEN
    // ========================================================

    currentQuestions.forEach(
        (category, categoryIndex) => {

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
                (question, questionIndex) => {

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
                        () => toggleBox(box)
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


    // ========================================================
    // SEITEN WECHSELN
    // ========================================================

    const ageStep =
        document.getElementById(
            "step-age"
        );

    const questionStep =
        document.getElementById(
            "step-questions"
        );


    if (ageStep) {

        ageStep.classList.remove(
            "active"
        );
    }


    if (questionStep) {

        questionStep.classList.add(
            "active"
        );
    }
}


// ============================================================
// CHECKBOX / STATUS WECHSELN
// ============================================================
//
// leer
//   ↓
// 0 % = Kind zeigt Fähigkeit nicht
//   ↓
// 50 % = Kind zeigt Fähigkeit teilweise
//   ↓
// 100 % = Kind zeigt Fähigkeit vollständig
//   ↓
// leer
//
// ============================================================

function toggleBox(box) {

    if (!box) {
        return;
    }


    const currentValue =
        getBoxValue(box);


    let newValue;


    if (currentValue === null) {

        newValue = STATUS_VALUES.NOT_SHOWN;

    } else if (
        currentValue === STATUS_VALUES.NOT_SHOWN
    ) {

        newValue = STATUS_VALUES.PARTIAL;

    } else if (
        currentValue === STATUS_VALUES.PARTIAL
    ) {

        newValue = STATUS_VALUES.FULL;

    } else {

        newValue =
            STATUS_VALUES.NOT_RATED;
    }


    // ========================================================
    // STATUS SPEICHERN
    // ========================================================

    if (newValue === null) {

        box.removeAttribute(
            "data-value"
        );

    } else {

        box.setAttribute(
            "data-value",
            String(newValue)
        );
    }


    // ========================================================
    // KLASSEN
    // ========================================================

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


    // ========================================================
    // TOOLTIP
    // ========================================================

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


    res.innerHTML = "";


    // ========================================================
    // PRÜFEN
    // ========================================================

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
            (sum, category) =>
                sum +
                category.questions.length,
            0
        );


    // ========================================================
    // KATEGORIEN
    // ========================================================

    currentQuestions.forEach(
        (category, categoryIndex) => {

            let total = 0;

            let assessedCount = 0;

            let notObservedCount = 0;

            let notRatedCount = 0;

            let list = "";


            // ==================================================
            // FRAGEN
            // ==================================================

            category.questions.forEach(
                (question, questionIndex) => {

                    const box =
                        document.getElementById(
                            `q_${categoryIndex}_${questionIndex}`
                        );


                    const value =
                        getBoxValue(box);


                    // ==========================================
                    // NICHT BEWERTET
                    // ==========================================

                    if (value === null) {

                        notRatedCount++;

                        list += createResultQuestion(
                            question,
                            null
                        );

                        return;
                    }


                    // ==========================================
                    // BEWERTET
                    // ==========================================

                    total += value;

                    assessedCount++;

                    totalAll += value;

                    countAll++;


                    // ==========================================
                    // KIND ZEIGT ES NICHT
                    // ==========================================

                    if (
                        value ===
                        STATUS_VALUES.NOT_SHOWN
                    ) {

                        notObservedCount++;

                        notObservedAll++;
                    }


                    // ==========================================
                    // NICHT VOLLSTÄNDIG
                    // ==========================================

                    if (
                        value <
                        STATUS_VALUES.FULL
                    ) {

                        list += createResultQuestion(
                            question,
                            value
                        );
                    }
                }
            );


            // ==================================================
            // DURCHSCHNITT
            // ==================================================

            let average = 0;


            if (assessedCount > 0) {

                average =
                    total /
                    assessedCount;
            }


            // ==================================================
            // KATEGORIE-STATUS
            // ==================================================

            let categoryStatus =
                "Noch nicht bewertet";


            if (notRatedCount === 0) {

                if (average === 100) {

                    categoryStatus =
                        "Alles vollständig";

                } else if (average === 0) {

                    categoryStatus =
                        "Keine der bewerteten Fähigkeiten gezeigt";

                } else {

                    categoryStatus =
                        "Teilweise erfüllt";
                }

            } else if (assessedCount > 0) {

                categoryStatus =
                    "Teilweise bewertet";
            }


            // ==================================================
            // KREIS
            // ==================================================

            const size =
                assessedCount > 0
                    ? Math.max(
                        8,
                        (average / 100) * 40
                    )
                    : 8;


            // ==================================================
            // ERGEBNIS
            // ==================================================

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
                                ${escapeHtml(category.name)}
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
                            title="${Math.round(average)} %"
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
                                ${Math.round(average)} %
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


    // ========================================================
    // GESAMT
    // ========================================================

    const totalNotRated =
        totalQuestions -
        countAll;


    let overallAverage = 0;


    if (countAll > 0) {

        overallAverage =
            totalAll /
            countAll;
    }


    // ========================================================
    // GESAMTÜBERSICHT
    // ========================================================

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

                    ${Math.round(overallAverage)} %

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


    // ========================================================
    // SEITEN WECHSELN
    // ========================================================

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
                    ${escapeHtml(question)}
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

    if (value === null || value === undefined) {
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
// DETAILS EIN-/AUSBLENDEN
// ============================================================

function toggleResultDetails(element) {

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
// INITIALISIERUNG
// ============================================================

checkLogin();


// ============================================================
// ENDE
// ============================================================
