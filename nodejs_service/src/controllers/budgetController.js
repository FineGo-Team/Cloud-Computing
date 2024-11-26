const { db } = require("../utils/firebase");
const axios = require("axios");
const { getUserAge } = require("../service/function");

const getBudgetPlanPrediction = async (userId) => {
  try {
    // Mengambil data profile dari Firestore
    const profileDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();
    // Mengambil data expense dari Firestore
    const expenseDoc = await db.collection("users").doc(userId).collection("expense").doc("details").get();

    if (!profileDoc.exists || !expenseDoc.exists) {
      console.log("Profile or Expense not found");
      return { error: "Profile or Expense not found" };
    }

    const profile = profileDoc.data();
    const expense = expenseDoc.data();
    const age = profile ? getUserAge(profile.birth_date) : null;
    const province = profile ? profile.province : null;

    // Menyiapkan data untuk prediksi
    let inputData = {
      age: age,
      province: province,
      income: profile ? profile.income : null,
      transportation: expense ? expense.transportation : null,
      housing_cost: expense ? expense.housing_cost : null,
      electricity_bill: expense ? expense.electricity : null,
      water_bill: expense ? expense.water_bill : null,
      internet_bill: expense ? expense.internet_bill : null,
      debt: expense ? expense.debt : null,
    };

    // Mengirim data ke Flask service untuk mendapatkan prediksi
    const flaskService = "http://127.0.0.1:5000/budget_plan";
    const response = await axios.post(flaskService, { inputData });
    const prediction = response.data;

    // Menyimpan hasil prediksi ke Firestore
    await db
      .collection("users")
      .doc(userId)
      .collection("predictions")
      .doc("budget_plan")
      .set(
        {
          predictions: db.firestore.FieldValue.arrayUnion({
            date: new Date().toISOString(),
            ...prediction,
          }),
        },
        { merge: true }
      );

    console.log("Prediction Saved: ", prediction);
    return prediction;
  } catch (err) {
    console.log("Failed to retrieve data or send to Flask", err);
    throw err;
  }
};

const budgetPlanHandler = async (request, h) => {
  const userId = request.params.id;

  try {
    const prediction = await getBudgetPlanPrediction(userId);
    if (prediction.error) {
      return h
        .response({
          status: "error",
          message: prediction.error,
        })
        .code(404);
    }

    return h
      .response({
        status: "success",
        recommendations: prediction,
      })
      .code(200);
  } catch (err) {
    return h
      .response({
        status: "error",
        message: "Failed to retrieve prediction",
      })
      .code(500);
  }
};

module.exports = { budgetPlanHandler, getBudgetPlanPrediction };
