const { db } = require("../firebase/admin");

async function saveDecision(data) {
  await db.collection("decisions").add({
    ...data,
    createdAt: new Date()
  });
}

module.exports = saveDecision;
