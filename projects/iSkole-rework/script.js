import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** 1) Koble til Supabase (BYTT til dine nøkler) */
const supabase = createClient(
  "https://ahkcefozgmvzqamouwau.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoa2NlZm96Z212enFhbW91d2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjYyODEsImV4cCI6MjA4OTg0MjI4MX0.ZkZSxJ6F8ewwoQpWbXhC69cXldVG-6Dswvqzl7jHjHc",
);

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

openBtn.addEventListener("click", () => panel.classList.add("open"));
closeBtn.addEventListener("click", () => panel.classList.remove("open"));

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    loginForm.style.display = tab === "login" ? "" : "none";
    signupForm.style.display = tab === "signup" ? "" : "none";
  });
});

async function refreshAuthUI() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    loggedOut.style.display = "";
    loggedIn.style.display = "none";
    userBadge.textContent = "";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "user";
  loggedOut.style.display = "none";
  loggedIn.style.display = "";
  whoami.textContent = `Innlogget som ${user.email}`;
  roleBadge.textContent = `Rolle: ${role}`;
  userBadge.textContent = role === "admin" ? "Admin" : "Innlogget";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Logger inn...";
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    
    if (error) {
      loginMsg.textContent = "Feil: " + error.message;
    } else {
      loginMsg.textContent = "Innlogget ✅";
      await refreshAuthUI();
      setTimeout(() => panel.classList.remove("open"), 400);
    }
  } catch (err) {
    loginMsg.textContent = "En feil oppstod: " + err.message;
    console.error("Login exception:", err);
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupMsg.textContent = "Oppretter...";
  const name = document.getElementById("signupName").value.trim();
  const email = document
    .getElementById("signupEmail")
    .value.trim()
    .toLowerCase();
  const pass = document.getElementById("signupPass").value;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { display_name: name } },
    });

    signupMsg.textContent = error
      ? "Feil: " + error.message
      : "Konto opprettet ✅ Sjekk e-posten din for bekreftelse!.";
  } catch (err) {
    signupMsg.textContent = "En feil oppstod: " + err.message;
    console.error("Signup exception:", err);
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("SignOut exception:", err);
  }
  
  // Tøm feltene når du logger ut slik at neste innlogging er "ren"
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPass").value = "";
  loginMsg.textContent = "";
  
  await refreshAuthUI();
});

supabase.auth.onAuthStateChange(() => {
  refreshAuthUI();
});

refreshAuthUI();
