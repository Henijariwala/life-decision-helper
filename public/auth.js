import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ---------- FIREBASE CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------- HELPERS ----------
function showMessage(msg) {
  const el = document.getElementById("authMessage");
  if (el) el.innerText = msg;
}

// ---------- LOGIN ----------
window.login = async (email, password) => {
  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();

    document.cookie = `token=${token}; path=/`;
    location.href = "/chat";
  } catch (err) {
    showMessage(err.message);
  }
};

// ---------- REGISTER (THIS FIXES YOUR ISSUE) ----------
window.register = async (email, password) => {
  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage("✅ Account created! You can now sign in.");
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

// ---------- AUTO LOGIN CHECK ----------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    document.cookie = `token=${token}; path=/`;
  }
});
