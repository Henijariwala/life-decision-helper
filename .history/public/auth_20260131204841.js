import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ---------------- FIREBASE CONFIG ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ---------------- HELPERS ---------------- */
function showMessage(msg, isError = true) {
  const el = document.getElementById("authMessage");
  el.style.color = isError ? "red" : "green";
  el.innerText = msg;
}

/* ---------------- LOGIN ---------------- */
window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();

    document.cookie = `token=${token}; path=/`;
    window.location.href = "/chat";
  } catch (err) {
    showMessage(err.message);
  }
};

/* ---------------- CREATE ACCOUNT (FIXED) ---------------- */
window.createAccount = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

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
    showMessage("✅ Account created! You can now sign in.", false);
  } catch (err) {
    showMessage(err.message);
  }
};

/* ---------------- LOGOUT (OPTIONAL) ---------------- */
window.logout = async () => {
  await signOut(auth);
  document.cookie = "token=; Max-Age=0; path=/";
  window.location.href = "/";
};
