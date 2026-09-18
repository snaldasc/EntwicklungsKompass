
// ==========================================
// TERMINE – Modal öffnen/schließen
// ==========================================

const appointmentModal = document.getElementById("appointmentModal");
const editingAppointmentId =
  appointmentModal.dataset.editingAppointmentId || null;
const addAppointmentBtn = document.getElementById("addAppointmentBtn");
const closeAppointmentModal = document.getElementById("closeAppointmentModal");
const cancelAppointmentBtn = document.getElementById("cancelAppointmentBtn");

function openAppointmentModal() {
  if (appointmentModal) {
    appointmentModal.style.display = "flex";
    loadAppointmentChildren();
  }
}

function closeAppointmentModalFunc() {
  if (appointmentModal) {
    appointmentModal.style.display = "none";
  }
}

if (addAppointmentBtn) {
  addAppointmentBtn.addEventListener("click", openAppointmentModal);
}

if (closeAppointmentModal) {
  closeAppointmentModal.addEventListener("click", closeAppointmentModalFunc);
}

if (cancelAppointmentBtn) {
  cancelAppointmentBtn.addEventListener("click", closeAppointmentModalFunc);
}

// Modal schließen, wenn außerhalb geklickt wird
if (appointmentModal) {
  appointmentModal.addEventListener("click", function (event) {
    if (event.target === appointmentModal) {
      closeAppointmentModalFunc();
    }
  });
}

// ==========================================
// TERMINE – Kinder laden
// ==========================================

async function loadAppointmentChildren() {
  const select = document.getElementById("appointmentChild");

  if (!select) return;

  select.innerHTML = '<option value="">Kind auswählen</option>';

  const { data, error } = await supabaseClient
    .from("children")
    .select("id, child_code")
    .order("child_code");

  if (error) {
    console.error("Fehler beim Laden der Kinder:", error);
    return;
  }

  if (!data || data.length === 0) {
    select.innerHTML = '<option value="">Keine Kinder vorhanden</option>';
    return;
  }

  data.forEach((child) => {
    const option = document.createElement("option");

    option.value = child.id;
    option.textContent = child.child_code;

    select.appendChild(option);
  });
}

// ==========================================
// TERMINE – Termin speichern
// ==========================================

const saveAppointmentBtn = document.getElementById("saveAppointmentBtn");
if (saveAppointmentBtn) {
  saveAppointmentBtn.addEventListener("click", async function () {
    const title = document.getElementById("appointmentTitle").value.trim();
    const childId = document.getElementById("appointmentChild").value;
    const dateInput = document.getElementById("appointmentDate").value.trim();
    const time = document.getElementById("appointmentTime").value;
    const recurrence = document.getElementById("appointmentRecurrence").value;
    const countdownEnabled = document.getElementById(
      "appointmentCountdown",
    ).checked;

    // Datum TT.MM.JJJJ in YYYY-MM-DD umwandeln
    let date = "";

    if (dateInput) {
      const parts = dateInput.split(".");

      if (
        parts.length !== 3 ||
        parts[0].length !== 2 ||
        parts[1].length !== 2 ||
        parts[2].length !== 4
      ) {
        alert("Bitte das Datum im Format TT.MM.JJJJ eingeben.");
        return;
      }

      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]);

      const testDate = new Date(year, month - 1, day);

      if (
        testDate.getFullYear() !== year ||
        testDate.getMonth() !== month - 1 ||
        testDate.getDate() !== day
      ) {
        alert("Bitte ein gültiges Datum eingeben.");
        return;
      }

      date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Pflichtfelder prüfen
    if (!title) {
      alert("Bitte einen Terminname eingeben.");
      return;
    }

    if (!childId) {
      alert("Bitte ein Kind auswählen.");
      return;
    }

    if (!date) {
      alert("Bitte ein Datum eingeben.");
      return;
    }

    // Button deaktivieren
    saveAppointmentBtn.disabled = true;
    saveAppointmentBtn.textContent = "Speichert...";

    try {
      let data;
      let error;

      if (editingAppointmentId) {
        const result = await supabaseClient
          .from("child_appointments")
          .update({
            child_id: childId,
            title: title,
            event_date: date,
            event_time: time || null,
            recurrence: recurrence,
            countdown_enabled: countdownEnabled,
          })
          .eq("id", editingAppointmentId)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        const result = await supabaseClient
          .from("child_appointments")
          .insert({
            child_id: childId,
            title: title,
            event_date: date,
            event_time: time || null,
            recurrence: recurrence,
            countdown_enabled: countdownEnabled,
          })
          .select()
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Fehler beim Speichern des Termins:", error);

        alert("Termin konnte nicht gespeichert werden.");
        return;
      }

      console.log("Termin gespeichert:", data);

      alert(
        editingAppointmentId
          ? "Termin wurde geändert!"
          : "Termin wurde gespeichert!",
      );

      if (editingAppointmentId) {
        // Aktuelle Termine neu aus Supabase laden
        await loadChildAppointments();

        // Kalender neu zeichnen
        renderAppointmentCalendar();

        // Dashboard aktualisieren
        if (typeof loadDashboardAppointmentCountdowns === "function") {
          await loadDashboardAppointmentCountdowns();
        }
      }
      // Formular zurücksetzen
      document.getElementById("appointmentTitle").value = "";
      document.getElementById("appointmentChild").value = "";
      document.getElementById("appointmentDate").value = "";
      document.getElementById("appointmentTime").value = "";
      document.getElementById("appointmentRecurrence").value = "once";
      document.getElementById("appointmentCountdown").checked = false;

      appointmentModal.dataset.editingAppointmentId = "";

      document.getElementById("saveAppointmentBtn").textContent =
        "Termin speichern";

      closeAppointmentModalFunc();
    } catch (error) {
      console.error("Fehler:", error);

      alert("Beim Speichern ist ein Fehler aufgetreten.");
    } finally {
      saveAppointmentBtn.disabled = false;
      saveAppointmentBtn.textContent = "Termin speichern";
    }
  });
}

// ==========================================
// TERMINE EINES KINDES ANZEIGEN
// ==========================================

let currentAppointmentChildId = null;
let currentAppointmentMonth = new Date();
let currentChildAppointments = [];

async function openChildAppointments(childId) {
  const modal = document.getElementById("childAppointmentsModal");

  if (!modal) {
    console.error("childAppointmentsModal nicht gefunden.");
    return;
  }

  currentAppointmentChildId = childId;

  currentAppointmentMonth = new Date();
  currentAppointmentMonth.setDate(1);

  modal.style.display = "flex";

  await loadChildAppointments();
}

async function loadChildAppointments() {
  const list = document.getElementById("childAppointmentsList");

  const title = document.getElementById("childAppointmentsTitle");

  if (!list) return;

  list.innerHTML = "Termine werden geladen...";

  // Kind laden
  const { data: child, error: childError } = await supabaseClient
    .from("children")
    .select("id, child_code")
    .eq("id", currentAppointmentChildId)
    .single();

  if (childError) {
    console.error("Fehler beim Laden des Kindes:", childError);

    list.innerHTML = "<p>Kind konnte nicht geladen werden.</p>";

    return;
  }

  if (title) {
    title.textContent = "📅 Termine – " + child.child_code;
  }

  // Termine laden
  const { data: appointments, error } = await supabaseClient
    .from("child_appointments")
    .select("*")
    .eq("child_id", currentAppointmentChildId)
    .order("event_date", {
      ascending: true,
    });

  if (error) {
    console.error("Fehler beim Laden der Termine:", error);

    list.innerHTML = "<p>Termine konnten nicht geladen werden.</p>";

    return;
  }

  currentChildAppointments = appointments || [];

  // Zum Monat des ersten Termins springen
  if (currentChildAppointments.length > 0) {
    const firstAppointment = currentChildAppointments[0];

    if (firstAppointment.event_date) {
      const parts = firstAppointment.event_date.substring(0, 10).split("-");

      currentAppointmentMonth = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        1,
      );
    }
  }

  renderAppointmentCalendar();
}

function renderAppointmentCalendar() {
  const list = document.getElementById("childAppointmentsList");

  const monthTitle = document.getElementById("appointmentCurrentMonth");

  if (!list || !monthTitle) return;

  const year = currentAppointmentMonth.getFullYear();

  const month = currentAppointmentMonth.getMonth();

  const monthName = currentAppointmentMonth.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  monthTitle.textContent =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const firstDay = new Date(year, month, 1);

  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay();

  // Sonntag = 0 → Montag = 0
  startDay = startDay === 0 ? 6 : startDay - 1;

  const daysInMonth = lastDay.getDate();

  let html = `
        <div
            style="
                display:grid;
                grid-template-columns:
                    repeat(7, 1fr);
                gap:4px;
            "
        >
    `;

  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  weekdays.forEach((day) => {
    html += `
            <div
                style="
                    text-align:center;
                    font-weight:bold;
                    padding:8px 2px;
                "
            >
                ${day}
            </div>
        `;
  });

  // Leere Felder vor dem ersten Tag
  for (let i = 0; i < startDay; i++) {
    html += `
            <div></div>
        `;
  }

  // Tage erzeugen
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayAppointments = [];

    currentChildAppointments.forEach((appointment) => {
      const occurrences = getAppointmentOccurrences(appointment, year, month);

      if (occurrences.includes(dateString)) {
        dayAppointments.push(appointment);
      }
    });

    const hasAppointments = dayAppointments.length > 0;

    html += `
            <div
                style="
                    min-height:80px;
                    border:1px solid #ddd;
                    border-radius:8px;
                    padding:6px;
                    background:${hasAppointments ? "#eef6ff" : "#fff"};
                "
            >
                <div
                    style="
                        font-weight:bold;
                        margin-bottom:4px;
                    "
                >
                    ${day}
                </div>
        `;

    dayAppointments.forEach((appointment) => {
      const time = appointment.event_time
        ? appointment.event_time.substring(0, 5)
        : "";

      const countdown = appointment.countdown_enabled
        ? getAppointmentCountdown(appointment.event_date)
        : "";

      const recurrenceText = {
        once: "Einmalig",
        daily: "Täglich",
        weekly: "Wöchentlich",
        monthly: "Monatlich",
        yearly: "Jährlich",
      };

      const recurrenceLabel =
        recurrenceText[appointment.recurrence] ||
        appointment.recurrence ||
        "Einmalig";

      html += `
    <div
        style="
            background:#2563eb;
            color:white;
            padding:6px;
            border-radius:5px;
            font-size:12px;
            margin-top:3px;
        "
    >

        <div>
            ${time ? time + " " : ""}

            ${escapeHtml(appointment.title || "Termin")}
        </div>

        ${
          countdown
            ? `
                    <div
                        style="
                            margin-top:3px;
                            font-weight:bold;
                        "
                    >
                        ${countdown}
                    </div>
                `
            : ""
        }

        <div
            style="
                display:flex;
                gap:3px;
                margin-top:5px;
            "
        >

            <button
                type="button"
                data-edit-appointment="${escapeHtml(appointment.id)}"
                style="
                    border:0;
                    border-radius:4px;
                    padding:3px 6px;
                    cursor:pointer;
                    background:white;
                    color:#2563eb;
                    font-size:11px;
                "
            >
                ✏️
            </button>

            <button
                type="button"
                data-delete-appointment="${escapeHtml(appointment.id)}"
                style="
                    border:0;
                    border-radius:4px;
                    padding:3px 6px;
                    cursor:pointer;
                    background:#fee2e2;
                    color:#dc2626;
                    font-size:11px;
                "
            >
                🗑️
            </button>

        </div>

    </div>
`;
    });

    html += `
            </div>
        `;
  }

  html += "</div>";

  list.innerHTML = html;
  setupAppointmentCalendarButtons();
}

// Vorheriger Monat
const appointmentPrevMonth = document.getElementById("appointmentPrevMonth");

if (appointmentPrevMonth) {
  appointmentPrevMonth.addEventListener("click", () => {
    currentAppointmentMonth.setMonth(currentAppointmentMonth.getMonth() - 1);

    renderAppointmentCalendar();
  });
}

// Nächster Monat
const appointmentNextMonth = document.getElementById("appointmentNextMonth");

if (appointmentNextMonth) {
  appointmentNextMonth.addEventListener("click", () => {
    currentAppointmentMonth.setMonth(currentAppointmentMonth.getMonth() + 1);

    renderAppointmentCalendar();
  });
}

const closeChildAppointmentsModal = document.getElementById(
  "closeChildAppointmentsModal",
);

if (closeChildAppointmentsModal) {
  closeChildAppointmentsModal.addEventListener("click", () => {
    document.getElementById("childAppointmentsModal").style.display = "none";
  });
}

// ==========================================
// COUNTDOWN FÜR TERMINE
// ==========================================

function getAppointmentCountdown(eventDate) {
  if (!eventDate) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(`${String(eventDate).substring(0, 10)}T00:00:00`);

  targetDate.setHours(0, 0, 0, 0);

  const difference = targetDate.getTime() - today.getTime();

  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  // Nur Countdown anzeigen,
  // wenn das Ereignis innerhalb der nächsten 60 Tage liegt.
  if (days < 0 || days > 60) {
    return "";
  }

  if (days === 0) {
    return "⏳ Heute";
  }

  if (days === 1) {
    return "⏳ Morgen";
  }

  return `⏳ Noch ${days} Tage`;
}

// ==========================================
// DASHBOARD – TERMIN COUNTDOWNS
// ==========================================

async function loadDashboardAppointmentCountdowns() {
  const container = document.getElementById("dashboardAppointmentCountdowns");

  if (!container || !supabaseClient) {
    return;
  }

  container.innerHTML = "Termine werden geladen...";

  const { data: appointments, error } = await supabaseClient
    .from("child_appointments")
    .select(
      `
            id,
            child_id,
            title,
            event_date,
            countdown_enabled,
            children (
                child_code
            )
        `,
    )
    .eq("countdown_enabled", true)
    .order("event_date", {
      ascending: true,
    });

  if (error) {
    console.error("Dashboard-Termine konnten nicht geladen werden:", error);

    container.innerHTML = "";

    return;
  }

  const upcomingAppointments = (appointments || [])
    .map((appointment) => {
      const countdown = getAppointmentCountdown(appointment.event_date);

      return {
        ...appointment,
        countdown,
      };
    })
    .filter((appointment) => appointment.countdown !== "");

  if (upcomingAppointments.length === 0) {
    container.innerHTML = `
            <div
                style="
                    padding:16px;
                    border-radius:10px;
                    background:#f5f5f5;
                "
            >
                <strong>📅 Anstehende Termine</strong>
                <p style="margin-bottom:0;">
                    Keine Termine innerhalb der nächsten 60 Tage.
                </p>
            </div>
        `;

    return;
  }

  container.innerHTML = `
        <div
            style="
                padding:16px;
                border-radius:10px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
            "
        >

            <h3 style="margin-top:0;">
                📅 Anstehende Termine
            </h3>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        minmax(80px, 1fr)
                        minmax(140px, 2fr)
                        minmax(100px, 1fr)
                        minmax(120px, 1fr);
                    gap:8px;
                    font-weight:bold;
                    padding:10px;
                    border-bottom:2px solid #ddd;
                "
            >
                <div>Kind</div>
                <div>Termin</div>
                <div>Datum</div>
                <div>Tage bis Datum</div>
            </div>

            ${upcomingAppointments
              .map((appointment) => {
                const childCode =
                  appointment.children?.child_code || "Unbekannt";

                const date = appointment.event_date
                  ? new Date(
                      `${String(appointment.event_date).substring(
                        0,
                        10,
                      )}T00:00:00`,
                    ).toLocaleDateString("de-DE")
                  : "-";

                return `
                        <div
                            style="
                                display:grid;
                                grid-template-columns:
                                    minmax(80px, 1fr)
                                    minmax(140px, 2fr)
                                    minmax(100px, 1fr)
                                    minmax(120px, 1fr);
                                gap:8px;
                                padding:10px;
                                border-bottom:1px solid #eee;
                                align-items:center;
                            "
                        >

                            <div>
                                ${escapeHtml(childCode)}
                            </div>

                            <div>
                                ${escapeHtml(appointment.title || "Termin")}
                            </div>

                            <div>
                                ${escapeHtml(date)}
                            </div>

                            <div
                                style="
                                    font-weight:bold;
                                    color:#2563eb;
                                "
                            >
                                ${escapeHtml(appointment.countdown)}
                            </div>

                        </div>
                    `;
              })
              .join("")}

        </div>
    `;
}

function getAppointmentOccurrences(appointment, year, month) {
  const occurrences = [];

  if (!appointment.event_date) {
    return occurrences;
  }

  const dateParts = appointment.event_date.substring(0, 10).split("-");

  const startYear = Number(dateParts[0]);
  const startMonth = Number(dateParts[1]) - 1;
  const startDay = Number(dateParts[2]);

  const recurrence = appointment.recurrence || "once";

  const requestedMonth = new Date(year, month, 1);

  const startDate = new Date(startYear, startMonth, startDay);

  // Einmaliger Termin
  if (recurrence === "once") {
    if (startYear === year && startMonth === month) {
      occurrences.push(
        `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
      );
    }

    return occurrences;
  }

  // Termin liegt komplett vor dem Start
  if (requestedMonth < new Date(startYear, startMonth, 1)) {
    return occurrences;
  }

  // Täglich
  if (recurrence === "daily") {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);

      if (currentDate >= startDate) {
        occurrences.push(
          `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        );
      }
    }

    return occurrences;
  }

  // Wöchentlich
  if (recurrence === "weekly") {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const originalWeekday = startDate.getDay();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);

      if (
        currentDate >= startDate &&
        currentDate.getDay() === originalWeekday
      ) {
        occurrences.push(
          `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        );
      }
    }

    return occurrences;
  }

  // Monatlich
  if (recurrence === "monthly") {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (startDay <= daysInMonth) {
      const currentDate = new Date(year, month, startDay);

      if (currentDate >= startDate) {
        occurrences.push(
          `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
        );
      }
    }

    return occurrences;
  }

  // Jährlich
  if (recurrence === "yearly") {
    if (month === startMonth) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      if (startDay <= daysInMonth) {
        const currentDate = new Date(year, month, startDay);

        if (currentDate >= startDate) {
          occurrences.push(
            `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
          );
        }
      }
    }

    return occurrences;
  }

  return occurrences;
}

async function deleteChildAppointment(appointmentId) {
  if (!appointmentId) {
    alert("Keine Termin-ID gefunden.");
    return;
  }

  const confirmed = confirm("Möchtest du diesen Termin wirklich löschen?");

  if (!confirmed) {
    return;
  }

  console.log("Lösche Termin:", appointmentId);

  try {
    const { error } = await supabaseClient
      .from("child_appointments")
      .delete()
      .eq("id", appointmentId);

    if (error) {
      console.error("Fehler beim Löschen des Termins:", error);

      alert("Termin konnte nicht gelöscht werden.");

      return;
    }

    console.log("Termin erfolgreich gelöscht:", appointmentId);

    // Termine erneut aus Supabase laden
    await loadChildAppointments();

    // Kalender neu aufbauen
    renderAppointmentCalendar();

    // Dashboard aktualisieren
    if (typeof loadDashboardAppointmentCountdowns === "function") {
      await loadDashboardAppointmentCountdowns();
    }

    alert("Termin wurde gelöscht.");
  } catch (error) {
    console.error("Fehler beim Löschen:", error);

    alert("Beim Löschen ist ein Fehler aufgetreten.");
  }
}

function setupAppointmentCalendarButtons() {
  const list = document.getElementById("childAppointmentsList");

  if (!list) {
    console.log("Terminliste nicht gefunden");
    return;
  }

  const deleteButtons = list.querySelectorAll("[data-delete-appointment]");

  const editButtons = list.querySelectorAll("[data-edit-appointment]");

  console.log("Löschen-Buttons gefunden:", deleteButtons.length);

  console.log("Bearbeiten-Buttons gefunden:", editButtons.length);

  // ==========================================
  // LÖSCHEN
  // ==========================================

  deleteButtons.forEach((button) => {
    button.onclick = async function (event) {
      event.preventDefault();
      event.stopPropagation();

      const appointmentId = this.getAttribute("data-delete-appointment");

      console.log("Löschen geklickt:", appointmentId);

      await deleteChildAppointment(appointmentId);
    };
  });

  // ==========================================
  // BEARBEITEN
  // ==========================================

  editButtons.forEach((button) => {
    button.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();

      const appointmentId = this.getAttribute("data-edit-appointment");

      console.log("Bearbeiten geklickt:", appointmentId);

      editChildAppointment(appointmentId);
    };
  });
}

async function editChildAppointment(appointmentId) {
  if (!currentChildAppointments) {
    alert("Termine sind noch nicht geladen.");
    return;
  }

  const appointment = currentChildAppointments.find(
    (item) => item.id === appointmentId,
  );

  if (!appointment) {
    alert("Termin wurde nicht gefunden.");
    return;
  }

  // Terminname
  document.getElementById("appointmentTitle").value = appointment.title || "";

  // Kind
  const childSelect = document.getElementById("appointmentChild");

  if (childSelect) {
    const childId = appointment.child_id || "";

    const child = currentChildren?.find((item) => item.id === childId);

    const childCode = child?.child_code || "Kind";

    const childOption = Array.from(childSelect.options).find(
      (option) => option.value === childId,
    );

    if (childOption) {
      childSelect.value = childId;
    } else {
      const option = document.createElement("option");

      option.value = childId;

      option.textContent = childCode;

      option.selected = true;

      childSelect.appendChild(option);
    }
  }

  // Datum YYYY-MM-DD → TT.MM.JJJJ
  if (appointment.event_date) {
    const parts = String(appointment.event_date).substring(0, 10).split("-");

    if (parts.length === 3) {
      document.getElementById("appointmentDate").value =
        `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  } else {
    document.getElementById("appointmentDate").value = "";
  }

  // Uhrzeit
  document.getElementById("appointmentTime").value = appointment.event_time
    ? appointment.event_time.substring(0, 5)
    : "";

  // Wiederholung
  document.getElementById("appointmentRecurrence").value =
    appointment.recurrence || "once";

  // Countdown
  document.getElementById("appointmentCountdown").checked =
    appointment.countdown_enabled === true;

  // Termin-ID für das Bearbeiten merken
  const modal = document.getElementById("appointmentModal");

  modal.dataset.editingAppointmentId = appointmentId;

  // Modal direkt an den Body hängen,
  // damit es garantiert über dem Kalender liegt.
  document.body.appendChild(modal);

  // Button ändern
  const saveButton = document.getElementById("saveAppointmentBtn");

  saveButton.textContent = "Änderungen speichern";

  // Modal öffnen
  modal.style.display = "flex";
}
