import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ---------- FIREBASE INIT ----------
const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------- UI MESSAGE ----------
const showMessage = (msg) => {
  const el = document.getElementById("authMessage");
  if (el) el.innerText = msg;
};

// ---------- LOGIN ----------
window.login = async (email, password) => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();

    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
    location.href = "/chat";
  } catch (err) {
    showMessage(err.message);
  }
};

// ---------- REGISTER ----------
window.register = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage("✅ Account created. Please log in.");
  } catch (err) {
    showMessage(err.message);
  }
};

// ---------- LOGOUT ----------
window.logout = async () => {
  await signOut(auth);
  document.cookie = "token=; Max-Age=0; path=/";
  location.href = "/";
};

// ---------- AUTO TOKEN REFRESH ----------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
  }
});
