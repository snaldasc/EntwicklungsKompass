// ========================================
// SUPABASE LOGIN
// ========================================

const SUPABASE_URL = "https://sjekwvalxujnfparxees.supabase.co";


const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWt3dmFseHVqbmZwYXJ4ZWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MDU5NDQsImV4cCI6MjEwMzA4MTk0NH0.xMCPzUE7BHJpYYduKoRPQ-LC6UAJJzcJWsFhik-2oZ8";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ========================================
// LOGIN-ELEMENTE
// ========================================

const loginForm = document.getElementById("loginForm");
const loginScreen = document.getElementById("loginScreen");
const appContent = document.getElementById("appContent");
const loginError = document.getElementById("loginError");


// ========================================
// LOGIN-STATUS PRÜFEN
// ========================================

async function checkLogin() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (session) {

        // Eingeloggt
        loginScreen.style.display = "none";
        appContent.style.display = "block";

    } else {

        // Nicht eingeloggt
        loginScreen.style.display = "flex";
        appContent.style.display = "none";

    }
}


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    const {
        error
    } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });


    if (error) {

        loginError.textContent =
            "Anmeldung fehlgeschlagen: " + error.message;

        return;
    }


    await checkLogin();

});


// ========================================
// AUTH-ÄNDERUNGEN ÜBERWACHEN
// ========================================

supabaseClient.auth.onAuthStateChange(() => {
    checkLogin();
});


// ========================================
// BEIM LADEN DER SEITE PRÜFEN
// ========================================

checkLogin();


// ========================================
// ENTWICKLUNGSKOMPASS
// ========================================

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


let currentQuestions = [];


// ========================================
// ALTER / FRAGEN LADEN
// ========================================

function startAssessment() {

    const ageInput =
        document.getElementById('ageInput').value;

    const dobInput =
        document.getElementById('dobInput').value;

    let age = ageInput
        ? parseFloat(ageInput)
        : (
            dobInput
                ? (
                    new Date().getFullYear() -
                    new Date(dobInput).getFullYear()
                )
                : 0
        );


    if (age <= 0) {
        return alert(
            "Bitte Alter oder Geburtsdatum eingeben."
        );
    }


    let key =
        age < 2.5
            ? "1-2.5"
            : (
                age < 4.5
                    ? "2.5-4.5"
                    : "4.5-6"
            );


    currentQuestions = data[key];


    const container =
        document.getElementById('questionsContainer');

    container.innerHTML = "";


    currentQuestions.forEach((cat, c) => {

        let html =
            `<div class="question-group">
                <h3>${cat.name}</h3>`;


        cat.questions.forEach((q, i) => {

            html += `
                <div class="question-item">
                    <span>${q}</span>

                    <div
                        class="checkbox-box"
                        data-value="0"
                        onclick="toggleBox(this)"
                        id="q_${c}_${i}">
                    </div>

                </div>
            `;

        });


        container.innerHTML +=
            html + `</div>`;

    });


    document
        .getElementById('step-age')
        .classList
        .remove('active');


    document
        .getElementById('step-questions')
        .classList
        .add('active');
}


// ========================================
// CHECKBOX
// ========================================

function toggleBox(box) {

    let v =
        parseInt(
            box.getAttribute('data-value')
        );


    v =
        (v === 0)
            ? 50
            : (
                v === 50
                    ? 100
                    : 0
            );


    box.setAttribute(
        'data-value',
        v
    );


    box.className =
        'checkbox-box ' +
        (
            v === 50
                ? 'state-50'
                : (
                    v === 100
                        ? 'state-100'
                        : ''
                )
        );
}


// ========================================
// GUTACHTEN
// ========================================

function generateGutachten() {

    const res =
        document.getElementById(
            'resultsContainer'
        );


    res.innerHTML = "";


    currentQuestions.forEach((cat, c) => {

        let total = 0;
        let list = "";


        cat.questions.forEach((q, i) => {

            const v =
                parseInt(
                    document
                        .getElementById(
                            `q_${c}_${i}`
                        )
                        .getAttribute(
                            'data-value'
                        )
                );


            total += v;


            if (v < 100) {

                let stateClass =
                    v === 50
                        ? 'state-50'
                        : '';


                list += `
                    <li
                        style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            margin-bottom:8px;
                        "
                    >

                        <div
                            class="checkbox-box ${stateClass}"
                            style="
                                width:20px;
                                height:20px;
                                cursor:default;
                            "
                        ></div>

                        ${q}

                    </li>
                `;
            }

        });


        const avg =
            total / cat.questions.length;


        const size =
            (avg / 100) * 40;


        res.innerHTML += `
            <div
                class="result-item"
                onclick="
                    this.nextElementSibling.style.display =
                    (
                        this.nextElementSibling.style.display === 'block'
                        ? 'none'
                        : 'block'
                    )
                "
            >

                <div>
                    <strong>${cat.name}</strong>
                </div>

                <div class="circle-container">
                    <span
                        class="dynamic-circle"
                        style="
                            width:${size}px;
                            height:${size}px;
                        "
                    ></span>
                </div>

            </div>


            <div class="details">

                <b>Beobachtungsnotizen:</b>

                <ul
                    style="
                        list-style:none;
                        padding-left:0;
                        margin-top:8px;
                    "
                >
                    ${list || "Alles vollständig beobachtet!"}
                </ul>

            </div>
        `;

    });


    document
        .getElementById('step-questions')
        .classList
        .remove('active');


    document
        .getElementById('step-result')
        .classList
        .add('active');
}
