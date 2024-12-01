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

    // GET the most recent income document from Firestore
    const incomeQuerySnapshot = await db.collection("users").doc(userId).collection("income").orderBy("timestamp", "desc").limit(1).get();

    let totalIncome = 0;
    let savings = 0;

    incomeQuerySnapshot.forEach((doc) => {
      totalIncome = doc.data().total_income;
      savings = doc.data().savings;
    });

    const profileData = {
      ...userData,
      income: totalIncome,
      savings,
    };

    return h
      .response({
        status: "success",
        data: {
          profileData,
        },
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
  const { profile, expenses, income } = request.payload;

  // Dapatkan bulan saat ini
  const currentMonth = new Date().toISOString().slice(0, 7); // Format YYYY-MM

  // Fungsi untuk memastikan data adalah objek JavaScript murni
  const ensurePlainObject = (data) => {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        return value === undefined ? null : value; // Ganti undefined dengan null
      })
    );
  };

  const expensesData = {
    ...expenses,
    timestamp: new Date().toISOString(),
  };
  const incomeData = {
    ...income,
    timestamp: new Date().toISOString(),
  };

  try {
    // Insert User Information to Firestore
    await db.collection("users").doc(userId).collection("profile").doc("details").set(ensurePlainObject(profile), { merge: true });

    // Insert User Expenses to Firestore
    await db.collection("users").doc(userId).collection("expenses").doc(currentMonth).set(ensurePlainObject(expensesData), { merge: true });

    // Insert User Income to Firestore
    await db.collection("users").doc(userId).collection("income").doc(currentMonth).set(ensurePlainObject(incomeData), { merge: true });

    return h
      .response({
        status: "success",
        message: "User profile, expenses, and income data saved successfully",
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
