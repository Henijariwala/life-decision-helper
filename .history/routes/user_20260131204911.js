<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Life Decision Helper</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body class="center">

  <h1>🧭 Life Decision Helper</h1>
  <p class="subtitle">Think clearly. Decide calmly.</p>

  <!-- AUTH CARD -->
  <div class="auth-card">

    <!-- LOGGED OUT -->
    <div id="loggedOut">
      <input
        id="email"
        type="email"
        placeholder="Email address"
        autocomplete="username"
      />

      <input
        id="password"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
      />

      <button class="primary" onclick="login()">
        🔐 Sign In
      </button>

      <button class="secondary" onclick="createAccount()">
        ✨ Create Account
      </button>
    </div>

    <!-- LOGGED IN -->
    <div id="loggedIn" style="display:none">
      <p class="welcome">✅ You are logged in</p>

      <button onclick="location.href='/chat'">
        💬 Go to Chat
      </button>

      <button class="secondary" onclick="logout()">
        🚪 Sign Out
      </button>
    </div>

    <p id="authMessage" class="message"></p>
  </div>

  <script type="module" src="/auth.js"></script>

  <!-- SIMPLE UI TOGGLE -->
  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const loggedIn = document.getElementById("loggedIn");
      const loggedOut = document.getElementById("loggedOut");

      if (document.cookie.includes("token=")) {
        loggedOut.style.display = "none";
        loggedIn.style.display = "block";
      }
    });
  </script>

</body>
</html>
