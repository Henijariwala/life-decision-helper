const { db } = require("../firebase/admin");

module.exports = async function (data) {
  await db.collection("decisions").add({
    ...data,
    createdAt: new Date()
  });
};
