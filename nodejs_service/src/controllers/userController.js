const { db } = require("../utils/firebase");

// GET user personal information
const getUserProfile = async (request, h) => {
  const userId = request.params.id;

  try {
    // GET user information from Firestore
    const userDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();

    if (!userDoc.exists) {
      return h
        .response({
          status: "failed",
          message: "User not found",
        })
        .code(404);
    }

    const userData = userDoc.data();
    return h
      .response({
        status: "success",
        data: userData,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "failed",
        message: "Failed to get user profile",
      })
      .code(500);
  }
};

// Input User Information and Expenses
const inputUserInfo = async (request, h) => {
  const userId = request.params.id;
  const { profile, expense } = request.payload;

  try {
    // Insert User Information and User Expenses to Firestore
    await db.collection("users").doc(userId).collection("profile").doc("details").set(profile, { merge: true });
    await db.collection("users").doc(userId).collection("expense").doc("details").set(expense);

    return h
      .response({
        status: "success",
        message: "User profile and expense data saved successfully",
      })
      .code(201);
  } catch (err) {
    return h
      .response({
        status: "failed",
        message: err.message,
      })
      .code(500);
  }
};

module.exports = { getUserProfile, inputUserInfo };
