import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = async (e, p) => {
  const user = await signInWithEmailAndPassword(auth, e, p);
  const token = await user.user.getIdToken();
  document.cookie = `token=${token}; path=/`;
  location.href = "/chat";
};

window.register = async (e, p) => {
  await createUserWithEmailAndPassword(auth, e, p);
  alert("Registered. Please log in.");
};

window.logout = async () => {
  await signOut(auth);
  document.cookie = "token=; Max-Age=0";
  location.href = "/";
};
const showMessage = (msg) => {
  const el = document.getElementById("authMessage");
  if (el) el.innerText = msg;
};

window.login = async (email, password) => {
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
    const token = await user.user.getIdToken();
    document.cookie = `token=${token}; path=/`;
    location.href = "/chat";
  } catch (err) {
    showMessage(err.message);
  }
};

window.register = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage("Account created. Please login.");
  } catch (err) {
    showMessage(err.message);
  }
};
