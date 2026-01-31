import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper"
});

const auth = getAuth(app);

window.login = async (email, password) => {
  const u = await signInWithEmailAndPassword(auth, email, password);
  const token = await u.user.getIdToken();
  document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
  location.href = "/chat";
};

window.register = async (email, password) => {
  await createUserWithEmailAndPassword(auth, email, password);
  alert("Account created. Login now.");
};

window.logout = async () => {
  await signOut(auth);
  document.cookie = "token=; Max-Age=0; path=/";
  location.href = "/";
};

onAuthStateChanged(auth, async user => {
  if (user) {
    const token = await user.getIdToken();
    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
  }
});
