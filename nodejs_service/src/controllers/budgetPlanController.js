const { db, firestore } = require("../utils/firebase");
const axios = require("axios");
const getUserAge = require("../service/function");
const { FieldValue } = require("firebase-admin").firestore;

// Function to Send Request to model API endpoint to get Budget Planning
const getBudgetPlanPrediction = async (userId) => {
  try {
    // Take Data User Profile, Income, Expenses, and Monthly Report from Firestore
    const profileDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();
    const expenseQuerySnapshot = await db.collection("users").doc(userId).collection("expenses").orderBy("timestamp", "desc").limit(1).get();
    const incomeQuerySnapshot = await db.collection("users").doc(userId).collection("income").orderBy("timestamp", "desc").limit(1).get();
    const monthlyReportDoc = await db.collection("users").doc(userId).collection("predictions").doc("monthly_report").get();

    if (!profileDoc.exists || expenseQuerySnapshot.empty || incomeQuerySnapshot.empty || !monthlyReportDoc.exists) {
      return { error: "Profile, Expense, Income, or Monthly Report not found" };
    }

    // Get Last Data User Profile, Income, Expenses, and Monthly Report from Firestore
    const profile = profileDoc.data();
    const expense = expenseQuerySnapshot.docs[0].data();
    const income = incomeQuerySnapshot.docs[0].data();
    const reports = monthlyReportDoc.data().reports || [];

    // Urutkan array `reports` berdasarkan tanggal
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Ambil laporan terbaru
    const latestReport = reports[0];

    const age = getUserAge(profile.birth_date);
    const province = profile.province.toUpperCase();

    // Initialize Input Data for Model Machine Learning
    const inputData = {
      province,
      age,
      income: income.total_income || 0,
      food_expenses: expense.food_expenses || 0,
      transportation_expenses: expense.transportation_expenses || 0,
      housing_cost: expense.housing_cost || 0,
      electricity_bill: expense.electricity_bill || 0,
      water_bill: expense.water_bill || 0,
      internet_bill: expense.internet_cost || 0,
      debt: expense.debt || 0,
      savings: income.savings || 0,
    };

    const flaskService = "http://127.0.0.1:5000/budget_plan";
    const response = await axios.post(flaskService, { inputData });
    const prediction = response.data;

    // Calculate the Budget Plan based on User's Financial Report
    if (latestReport && latestReport.prediction !== "sehat") {
      expense.food_expenses = expense.food_expenses > 300000 ? expense.food_expenses * 0.98 : expense.food_expenses;
      expense.transportation_expenses = expense.transportation_expenses > 400000 ? expense.transportation_expenses * 0.93 : expense.transportation_expenses;
      expense.water_bill = expense.water_bill > 50000 ? expense.water_bill * 0.95 : expense.water_bill;
      expense.electricity_bill = expense.electricity_bill > 100000 ? expense.electricity_bill * 0.92 : expense.electricity_bill;
      expense.internet_cost = expense.internet_cost !== 0 ? expense.internet_cost * 0.9 : expense.internet_cost;
      expense.debt = expense.debt !== 0 ? expense.debt * 0.9 : expense.debt;
    }

    // Create Copy of expense field timestamp
    const { date, timestamp, ...budget_plan } = expense;

    await db
      .collection("users")
      .doc(userId)
      .collection("predictions")
      .doc("budget_plan")
      .set(
        {
          date: new Date().toISOString(),
          ...prediction,
          budget_plan,
        },
        { merge: true }
      );

    return prediction;
  } catch (err) {
    throw err;
  }
};

// Budget Planning Handler for Routes
const budgetPlanHandler = async (request, h) => {
  const userId = request.params.id;
  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    const predictionDoc = await db.collection("users").doc(userId).collection("predictions").doc("budget_plan").get();

    // Check Predictions Existing for this Month
    if (predictionDoc.exists) {
      const predictionData = predictionDoc.data();
      let existingPrediction = null;

      if (predictionData && predictionData.date && predictionData.date.startsWith(currentMonth)) {
        existingPrediction = predictionData;
      }

      if (existingPrediction) {
        return h
          .response({
            status: "success",
            recommendations: {
              ...existingPrediction,
            },
          })
          .code(200);
      }
    }

    // If in this month prediction is empty get prediction from getBudgetPlanPrediction
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
        recommendations: {
          ...prediction,
        },
      })
      .code(200);
  } catch (err) {
    console.log(err);
    return h
      .response({
        status: "error",
        message: "Failed to retrieve prediction",
      })
      .code(500);
  }
};

module.exports = { budgetPlanHandler, getBudgetPlanPrediction };
