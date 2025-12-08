import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** 1) Koble til Supabase (BYTT til dine nøkler) */
const supabase = createClient(
  "https://tbywtsnllvkoiuxnxjpq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieXd0c25sbHZrb2l1eG54anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMDc0MDEsImV4cCI6MjA3Njc4MzQwMX0.RvPYOW13Ypmi10zSyPDJgITdzHZpil2FBS6E7GzIWvs",
  {
    auth: {
      storage: sessionStorage, // <-- Dette er magien!
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/** 2) Finn elementer */
const panel = document.getElementById("authPanel");
const openBtn = document.getElementById("authOpenBtn");
const closeBtn = document.getElementById("authCloseBtn");
const userBadge = document.getElementById("authUserBadge");

const loggedOut = document.getElementById("authLoggedOut");
const loggedIn = document.getElementById("authLoggedIn");
const whoami = document.getElementById("whoami");
const roleBadge = document.getElementById("roleBadge");

const tabButtons = document.querySelectorAll("[data-tab]");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginMsg = document.getElementById("loginMsg");
const signupMsg = document.getElementById("signupMsg");

/** 3) Åpne/lukk panel */
openBtn.addEventListener("click", () => {
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false"); // <-- VIKTIG: Fortell at panelet er synlig
  // Sett fokus i e-postfeltet for bedre brukervennlighet
  setTimeout(() => document.getElementById("loginEmail").focus(), 100);
});

closeBtn.addEventListener("click", () => {
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true"); // <-- Fortell at panelet er skjult igjen
});

/** 4) Bytt mellom "Logg inn" og "Opprett profil" */
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    loginForm.style.display = tab === "login" ? "" : "none";
    signupForm.style.display = tab === "signup" ? "" : "none";
  });
});

/** 5) Oppdater UI (bruker + rolle) */
async function refreshAuthUI() {
  // BRUK getSession() I STEDET FOR getUser()
  // Denne returnerer bare null hvis du ikke er logget inn, uten å lage rød error.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // 1. Sjekk om vi faktisk har en bruker-sesjon
  if (!session) {
    // Ingen logget inn -> Vis utlogget-skjerm
    loggedOut.style.display = "";
    loggedIn.style.display = "none";
    userBadge.textContent = "";

    // Skjul admin-panelet hvis det finnes
    const adminSection = document.getElementById("adminSection");
    if (adminSection) adminSection.style.display = "none";

    return; // Stopp funksjonen her
  }

  // 2. Hvis vi kommer hit, ER vi logget inn.
  const user = session.user;

  // Hent profil og rolle fra databasen
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "user";

  // 3. Oppdater UI for innlogget bruker
  loggedOut.style.display = "none";
  loggedIn.style.display = "";
  whoami.textContent = `Innlogget som ${user.email}`;
  roleBadge.textContent = `Rolle: ${role}`;
  userBadge.textContent = role === "admin" ? "Admin" : "Innlogget";

  // 4. Admin-logikk
  const adminSection = document.getElementById("adminSection");
  if (role === "admin") {
    if (adminSection) {
      adminSection.style.display = "block";
      // Hvis du la inn funksjonen for å laste brukere:
      if (typeof loadAdminUserList === "function") loadAdminUserList();
    }
  } else {
    if (adminSection) adminSection.style.display = "none";
  }
}

/**  6) Logg inn */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Logger inn...";

  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  // Legg til feilsøking i konsollen
  console.log("Forsøker login med:", email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    console.error("Supabase Error:", error); // <-- Se feilen i konsollen
    loginMsg.textContent = "Feil: " + error.message;
    loginMsg.style.color = "red";
  } else {
    console.log("Login Suksess:", data);
    loginMsg.textContent = "Innlogget ✅";
    loginMsg.style.color = "green";

    await refreshAuthUI();

    // Lukk panelet etter 1 sekund ved suksess
    setTimeout(() => {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }, 1000);
  }
});

/** 7) Opprett bruker */
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "Oppretter...";
  const name = document.getElementById("signupName").value.trim();
  const email = document
    .getElementById("signupEmail")
    .value.trim()
    .toLowerCase();
  const pass = document.getElementById("signupPass").value;

  const { error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { data: { display_name: name } },
  });

  signupMsg.textContent = error
    ? "Feil: " + error.message
    : "Konto opprettet ✅ Du kan logge inn nå.";
});

/** 8) Logg ut */
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshAuthUI();
});

/** 9) Hold UI i sync */
supabase.auth.onAuthStateChange(() => refreshAuthUI());
refreshAuthUI();
