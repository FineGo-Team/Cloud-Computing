const { db } = require("../utils/firebase");
const { convertToISOString } = require("../service/function");

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
        message: `Failed to get user profile: ${error.message}`,
      })
      .code(500);
  }
};

// Input User Information and Expenses
const inputUserInfo = async (request, h) => {
  const userId = request.params.id;
  const { profile, expenses, income } = request.payload;

  // Get Current Month
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Function for check JavaScript Object validity
  const ensurePlainObject = (data) => {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        return value === undefined ? null : value;
      })
    );
  };

  // Convert birth date to ISO String and Format YYYY-MM-DD
  if (profile.birthdate) {
    profile.birthdate = convertToISOString(profile.birthdate);
  }

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
        message: `Failed to input user information: ${err.message}`,
      })
      .code(500);
  }
};

module.exports = { getUserProfile, inputUserInfo };
