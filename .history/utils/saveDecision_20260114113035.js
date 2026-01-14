const { db } = require("../firebase/admin");

module.exports = async (decision, userId) => {
  await db.collection("decisions").add({
    ...decision,
    userId,
    createdAt: new Date()
  });
};
