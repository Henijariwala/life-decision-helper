import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    document.cookie = `token=${token}; path=/; Secure; SameSite=Lax`;
    location.href = "/chat";
  }
});
