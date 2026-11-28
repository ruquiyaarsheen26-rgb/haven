
/* ======================================================
   HAVEN — MAIN JAVASCRIPT
   Created by Ruquiya Arsheen
   Copyright © 2026 Ruquiya Arsheen
   ====================================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const MOODS = {
  Happy: "😊",
  Okay: "😌",
  Anxious: "🥺",
  Sad: "😔",
  Angry: "😤"
};

const affirmations = [
  "You are allowed to grow at your own pace.",
  "You don't have to be perfect to be worthy.",
  "Small steps are still progress.",
  "You deserve the kindness you give to others.",
  "It is okay to rest. You are not falling behind.",
  "You have made it through difficult days before.",
  "You are allowed to begin again.",
  "Your feelings are valid, even when they are difficult.",
  "You do not need to have everything figured out today.",
  "There is beauty in becoming who you are."
];

const journalPrompts = [
  "What is something you wish someone understood about you?",
  "What made you smile recently, even for a moment?",
  "What is something you need to let go of?",
  "When do you feel most like yourself?",
  "What would you tell your younger self today?",
  "What is one thing you are proud of?",
  "What does a peaceful day look like to you?",
  "What is something you want to make more time for?"
];

const supportMessages = {
  anxious:
    "Let's slow things down for a moment. Place both feet on the ground. Breathe in gently, then breathe out slowly. You don't need to solve everything right now. Focus on just this one moment. ♡",

  sad:
    "I'm sorry things feel heavy right now. You don't have to pretend to be okay. Give yourself permission to feel what you feel. Try doing one small comforting thing for yourself. You deserve care, especially on difficult days. 🌷",

  overwhelmed:
    "Pause for a moment. You do not have to do everything at once. Choose just one small thing that needs your attention. Everything else can wait. Taking a break is allowed, too. One step at a time. 🌿",

  motivation:
    "Look how far you've already come. You don't need to make huge progress today. Show up in whatever way you can. Your small efforts matter, and you are capable of learning as you go. Keep being patient with yourself. 🌱"
};

let selectedMood = "";
let toastTimeout;

// ======================================================
// STORAGE HELPERS — INDEXEDDB
// ======================================================

async function getData(key, fallback = []) {
  const value = await HavenStorage.get(key);
  return value === undefined ? fallback : value;
}

// ======================================================
// GENERAL HELPERS
// ======================================================

function todayKey() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function showToast(message) {
  const toast = $("#toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// ======================================================
// NAVIGATION
// ======================================================

function go(viewName) {
  $$(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewName);
  });

  $$(".nav-item").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );
  });

  if (viewName === "journal") renderEntries();
  if (viewName === "board") renderBoard();
  if (viewName === "review") renderReview();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function setupNavigation() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      go(button.dataset.view);
    });
  });

  $$("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      go(button.dataset.go);
    });
  });
}

// ======================================================
// MOOD TRACKER
// ======================================================

function setupMood() {
  $$("#homeMoodOptions .mood-option").forEach((button) => {
    button.addEventListener("click", () => {
      selectedMood = button.dataset.mood;

      $$("#homeMoodOptions .mood-option").forEach((option) => {
        option.classList.toggle(
          "selected",
          option.dataset.mood === selectedMood
        );
      });

      $("#moodMessage").textContent =
        `${MOODS[selectedMood]} ${selectedMood} — thank you for checking in.`;
    });
  });
}

async function saveMood() {
  if (!selectedMood) {
    showToast("Choose a mood first ♡");
    return;
  }

  const moods = await getData("moods", []);

  moods.push({
    mood: selectedMood,
    emoji: MOODS[selectedMood],
    date: new Date().toISOString(),
    day: todayKey()
  });

  await HavenStorage.set("moods", moods);

  $("#moodMessage").textContent =
    "Your check-in has been saved. Be gentle with yourself ♡";

  selectedMood = "";

  $$("#homeMoodOptions .mood-option").forEach((button) => {
    button.classList.remove("selected");
  });

  showToast("Mood check-in saved ♡");
}

// ======================================================
// AFFIRMATIONS
// ======================================================

function newAffirmation() {
  $("#affirmationText").textContent = randomItem(affirmations);
}

// ======================================================
// JOURNAL
// ======================================================

async function saveEntry() {
  const title = $("#entryTitle").value.trim();
  const text = $("#entryText").value.trim();
  const mood = $("#entryMood").value;

  if (!text) {
    showToast("Write a little something first ♡");
    $("#entryText").focus();
    return;
  }

  const entries = await getData("entries", []);

  entries.unshift({
    id: Date.now(),
    title: title || "A little thought",
    text,
    mood,
    emoji: MOODS[mood] || "📖",
    date: new Date().toISOString()
  });

  await HavenStorage.set("entries", entries);

  $("#entryTitle").value = "";
  $("#entryText").value = "";
  $("#entryMood").value = "";

  await renderEntries();

  showToast("Your journal page is saved ♡");
}

async function renderEntries() {
  const entries = await getData("entries", []);
  const list = $("#entriesList");

  list.replaceChildren();

  $("#entryCount").textContent =
    `${entries.length} ${entries.length === 1 ? "page" : "pages"}`;

  if (entries.length === 0) {
    const empty = document.createElement("div");

    empty.className = "empty-state";
    empty.textContent =
      "Your pages will appear here. Whenever you're ready, start with a thought. 🌷";

    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";

    const top = document.createElement("div");
    top.className = "entry-top";

    const titleArea = document.createElement("div");

    const title = document.createElement("h4");
    title.textContent = entry.title || "A little thought";

    const date = document.createElement("small");
    date.className = "entry-date";
    date.textContent = formatDate(entry.date);

    titleArea.append(title, date);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      deleteEntry(entry.id);
    });

    top.append(titleArea, deleteButton);

    const content = document.createElement("p");
    content.className = "entry-text";
    content.textContent = entry.text;

    card.append(top, content);

    if (entry.mood) {
      const mood = document.createElement("small");

      mood.className = "entry-mood";
      mood.textContent = `${MOODS[entry.mood] || ""} ${entry.mood}`;

      card.appendChild(mood);
    }

    list.appendChild(card);
  });
}

async function deleteEntry(id) {
  const entries = await getData("entries", []);

  const updated = entries.filter((entry) => entry.id !== id);

  await HavenStorage.set("entries", updated);
  await renderEntries();

  showToast("Journal page deleted.");
}

function newJournalPrompt() {
  $("#journalPrompt").textContent = randomItem(journalPrompts);
}

// ======================================================
// MOOD BOARD
// ======================================================

async function addTile(
  text,
  emoji = "🌷",
  tag = "a little reminder"
) {
  const cleanText = text.trim();

  if (!cleanText) {
    showToast("Write something for your board first.");
    return;
  }

  const tiles = await getData("tiles", []);

  tiles.unshift({
    id: Date.now() + Math.random(),
    text: cleanText,
    emoji,
    tag
  });

  await HavenStorage.set("tiles", tiles);
  await renderBoard();

  $("#tileText").value = "";

  showToast("Added to your mood board ♡");
}

async function renderBoard() {
  const tiles = await getData("tiles", []);
  const board = $("#boardGrid");

  board.replaceChildren();

  if (tiles.length === 0) {
    const empty = document.createElement("div");

    empty.className = "empty-state";
    empty.textContent =
      "Your board is waiting for little pieces of inspiration. 🌱";

    board.appendChild(empty);
    return;
  }

  tiles.forEach((tile) => {
    const card = document.createElement("article");
    card.className = "board-tile";

    const emoji = document.createElement("span");
    emoji.className = "tile-emoji";
    emoji.textContent = tile.emoji || "🌷";

    const text = document.createElement("p");
    text.textContent = tile.text;

    const tag = document.createElement("small");
    tag.textContent = tile.tag || "a little reminder";

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Delete tile");

    remove.addEventListener("click", () => {
      deleteTile(tile.id);
    });

    card.append(emoji, text, tag, remove);

    board.appendChild(card);
  });
}

async function deleteTile(id) {
  const tiles = await getData("tiles", []);

  const updated = tiles.filter((tile) => tile.id !== id);

  await HavenStorage.set("tiles", updated);
  await renderBoard();

  showToast("Tile removed.");
}

function setupQuickTiles() {
  $$(".quick-add-button").forEach((button) => {
    button.addEventListener("click", () => {
      const parts = button.dataset.tile.split("|");

      addTile(parts[0], parts[1], parts[2]);
    });
  });
}

// ======================================================
// WEEKLY CHECK-IN
// ======================================================

function isWithinLastSevenDays(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();

  const start = new Date(now);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return (
    !Number.isNaN(date.getTime()) &&
    date >= start &&
    date <= now
  );
}

function todayFromDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function renderReview() {
  const entries = await getData("entries", []);
  const moods = await getData("moods", []);

  const weeklyEntries = entries.filter((entry) =>
    isWithinLastSevenDays(entry.date)
  );

  const weeklyMoods = moods.filter((mood) =>
    isWithinLastSevenDays(mood.date)
  );

  $("#weeklyEntries").textContent = weeklyEntries.length;
  $("#weeklyMoods").textContent = weeklyMoods.length;

  const counts = {};

  weeklyMoods.forEach((item) => {
    counts[item.mood] = (counts[item.mood] || 0) + 1;
  });

  let favourite = "—";

  Object.keys(counts).forEach((mood) => {
    if (
      favourite === "—" ||
      counts[mood] > counts[favourite]
    ) {
      favourite = mood;
    }
  });

  $("#weeklyFavourite").textContent = favourite;

  const chart = $("#moodChart");

  chart.replaceChildren();

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");

    const dayMoods = weeklyMoods.filter((item) => {
      return (item.day || todayFromDate(item.date)) === key;
    });

    days.push({
      label: date.toLocaleDateString(undefined, {
        weekday: "short"
      }),
      moods: dayMoods
    });
  }

  days.forEach((day) => {
    const column = document.createElement("div");
    column.className = "chart-day";

    const emoji = document.createElement("span");

    emoji.textContent = day.moods.length
      ? day.moods[day.moods.length - 1].emoji || "♡"
      : "·";

    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "chart-bar";

    bar.style.height =
      `${Math.min(day.moods.length * 35, 100)}px`;

    bar.style.opacity = day.moods.length ? "1" : "0.2";

    wrap.appendChild(bar);

    const label = document.createElement("small");
    label.textContent = day.label;

    column.append(emoji, wrap, label);

    chart.appendChild(column);
  });

  const reflection = await getData("reflection", "");

  $("#weeklyReflection").value = reflection || "";
}

async function saveReflection() {
  const reflection = $("#weeklyReflection").value.trim();

  await HavenStorage.set("reflection", reflection);

  showToast("Your reflection has been saved ♡");
}

// ======================================================
// SUPPORT SECTION
// ======================================================

function setupSupport() {
  $$(".support-option").forEach((button) => {
    button.addEventListener("click", () => {
      const message = supportMessages[button.dataset.support];

      const response = $("#supportResponse");

      response.replaceChildren();

      const icon = document.createElement("span");
      icon.textContent = "💌";

      const text = document.createElement("p");
      text.textContent = message;

      response.append(icon, text);
    });
  });
}

// ======================================================
// PIN PRIVACY
// Basic convenience lock — not encryption.
// ======================================================

function hashPin(pin) {
  let hash = 5381;

  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) + hash) ^ pin.charCodeAt(i);
  }

  return String(hash >>> 0);
}

function hasPin() {
  return Boolean(localStorage.getItem("haven-pin"));
}

function isUnlocked() {
  return sessionStorage.getItem("haven-unlocked") === "yes";
}

function openPinModal(mode) {
  const modal = $("#pinModal");

  const setupFields = $("#pinSetupFields");
  const unlockFields = $("#pinUnlockFields");
  const removeButton = $("#removePinButton");

  $("#pinMessage").textContent = "";

  $("#pinInput").value = "";
  $("#pinConfirm").value = "";
  $("#unlockPin").value = "";

  if (mode === "setup") {
    $("#pinTitle").textContent = "Create your private space";

    $("#pinDescription").textContent =
      "Choose a 4–6 digit PIN for a little extra privacy.";

    $("#pinActionButton").textContent = "Set PIN";

    setupFields.hidden = false;
    unlockFields.hidden = true;
    removeButton.hidden = true;

  } else {
    $("#pinTitle").textContent = "Welcome back";

    $("#pinDescription").textContent =
      "Enter your PIN to open your Haven space.";

    $("#pinActionButton").textContent = "Unlock";

    setupFields.hidden = true;
    unlockFields.hidden = false;
    removeButton.hidden = false;
  }

  modal.hidden = false;

  setTimeout(() => {
    const field =
      mode === "setup" ? $("#pinInput") : $("#unlockPin");

    field.focus();
  }, 50);
}

function closePinModal() {
  $("#pinModal").hidden = true;
}

function setupPin() {
  const pin = $("#pinInput").value.trim();
  const confirm = $("#pinConfirm").value.trim();

  if (!/^\d{4,6}$/.test(pin)) {
    $("#pinMessage").textContent =
      "Please enter a PIN containing 4–6 digits.";

    return;
  }

  if (pin !== confirm) {
    $("#pinMessage").textContent =
      "The PINs do not match. Please try again.";

    return;
  }

  localStorage.setItem("haven-pin", hashPin(pin));

  sessionStorage.setItem("haven-unlocked", "yes");

  closePinModal();

  showToast("Your PIN has been set ♡");
}

function unlockHaven() {
  const pin = $("#unlockPin").value.trim();

  const savedHash = localStorage.getItem("haven-pin");

  if (!pin || hashPin(pin) !== savedHash) {
    $("#pinMessage").textContent =
      "That PIN isn't correct. Try again.";

    return;
  }

  sessionStorage.setItem("haven-unlocked", "yes");

  closePinModal();

  showToast("Welcome back ♡");
}

function removePin() {
  const pin = $("#unlockPin").value.trim();

  const savedHash = localStorage.getItem("haven-pin");

  if (!pin || hashPin(pin) !== savedHash) {
    $("#pinMessage").textContent =
      "Enter your current PIN to remove it.";

    return;
  }

  localStorage.removeItem("haven-pin");

  sessionStorage.removeItem("haven-unlocked");

  closePinModal();

  showToast("PIN removed.");
}

function setupPrivacy() {
  $("#lockButton").addEventListener("click", () => {
    if (hasPin()) {
      openPinModal("unlock");
    } else {
      openPinModal("setup");
    }
  });

  $("#closePinModal").addEventListener("click", () => {
    if (hasPin() && !isUnlocked()) return;

    closePinModal();
  });

  $("#pinActionButton").addEventListener("click", () => {
    if ($("#pinUnlockFields").hidden) {
      setupPin();
    } else {
      unlockHaven();
    }
  });

  $("#removePinButton").addEventListener("click", removePin);

  $("#pinModal").addEventListener("click", (event) => {
    if (event.target === $("#pinModal")) {
      if (hasPin() && !isUnlocked()) return;

      closePinModal();
    }
  });

  if (hasPin() && !isUnlocked()) {
    openPinModal("unlock");
  }
}

// ======================================================
// BUTTON EVENTS
// ======================================================

function setupButtons() {
  $("#saveMoodButton").addEventListener("click", saveMood);

  $("#newAffirmationButton").addEventListener(
    "click",
    newAffirmation
  );

  $("#saveEntryButton").addEventListener(
    "click",
    saveEntry
  );

  $("#newPromptButton").addEventListener(
    "click",
    newJournalPrompt
  );

  $("#addTileButton").addEventListener("click", () => {
    addTile(
      $("#tileText").value,
      $("#tileEmoji").value
    );
  });

  $("#saveReflectionButton").addEventListener(
    "click",
    saveReflection
  );
}

// ======================================================
// INITIALIZE HAVEN
// ======================================================

async function startHaven() {
  try {
    await HavenStorage.init();

    setupNavigation();
    setupMood();
    setupSupport();
    setupQuickTiles();
    setupPrivacy();
    setupButtons();

    newAffirmation();
    newJournalPrompt();

    await renderEntries();
    await renderBoard();
    await renderReview();

  } catch (error) {
    console.error("Haven could not start:", error);

    document.body.innerHTML = `
      <main style="max-width:600px;margin:80px auto;padding:25px;text-align:center;font-family:sans-serif;color:#503b4a">
        <h1>Haven couldn't open its storage.</h1>
        <p>Please try opening the app in a supported browser and make sure site storage is enabled.</p>
        <p>Your browser's private browsing mode may prevent some storage features from working.</p>
      </main>
    `;
  }
}

document.addEventListener("DOMContentLoaded", startHaven);
