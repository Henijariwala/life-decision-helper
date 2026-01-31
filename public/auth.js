import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function showMessage(msg, isError = true) {
  const el = document.getElementById("authMessage");
  if (!el) return;
  el.style.color = isError ? "red" : "green";
  el.innerText = msg;
}

/* LOGIN */
window.login = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    document.cookie = `token=${token}; path=/`;
    location.href = "/chat";
  } catch (e) {
    showMessage(e.message);
  }
};

/* CREATE ACCOUNT */
window.createAccount = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage("✅ Account created! You can sign in now.", false);
  } catch (e) {
    showMessage(e.message);
  }
};

/* LOGOUT */
window.logout = async () => {
  await signOut(auth);
  document.cookie = "token=; Max-Age=0; path=/";
  location.href = "/";
};

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
