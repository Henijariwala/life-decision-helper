import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT"
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
