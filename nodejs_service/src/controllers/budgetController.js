const { db } = require("../utils/firebase");
const axios = require("axios");
const { getUserAge } = require("../service/function");

const getBudgetPlanPrediction = async (userId) => {
  try {
    const profileDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();
    const expenseDoc = await db.collection("users").doc(userId).collection("expense").doc("details").get();

    if (!profileDoc.exists || !expenseDoc.exists) {
      console.log("Profile or Expense not found");
      return;
    }

    const profile = profileDoc.data();
    const expense = profileDoc.data();
    const age = profile ? getUserAge(profile.birth_date) : null;
    const province = profile ? profile.province : null;

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

    const transactionsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .where("date", ">=", new Date(new Date().setDate(1)))
      .where("date", "<=", new Date(new Date()))
      .get();

    if (!transactionsSnapshot.empty) {
      let totalTransactions = {
        transportation: 0,
        housing_cost: 0,
        electricity_bill: 0,
        water_bill: 0,
        internet_bill: 0,
        debt: 0,
      };

      transactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        totalTransactions.transportation += transaction.transportation || 0;
        totalTransactions.housing_cost += transaction.housing_cost || 0;
        totalTransactions.electricity_bill += transaction.electricity_bill || 0;
        totalTransactions.water_bill += transaction.water_bill || 0;
        totalTransactions.internet_bill += transaction.internet_bill || 0;
        totalTransactions.debt += transaction.debt || 0;
      });

      inputData = {
        age: age,
        province: province,
        ...totalTransactions,
      };
    }

    // TODO: Input Flask Service URL Endpoint
    const flaskService = "";
    const response = await axios.post(flaskService, { inputData: inputData });
    const prediction = response.data;

    await db
      .collection("users")
      .doc(userId)
      .collection("predictions")
      .doc("budget_plan")
      .update({
        predictions: db.firestore.FieldValue.arrayUnion({
          date: new Date().toISOString(),
          ...prediction,
        }),
      });

    console.log("Prediction Saved: ", prediction);
    return prediction;
  } catch (err) {
    console.log("Failed to retrieve data or send to Flask", err);
    throw err;
  }
};

const getPredictionFromDatabase = async (userId) => {
  try {
    const budgetPlanDoc = await db.collection("users").doc(userId).collection("predictions").doc("budget_plan").get();
    const budgetPlan = budgetPlanDoc.data().predictions;

    if (!budgetPlan.exists || budgetPlan.length === 0) {
      const prediction = await getBudgetPlanPrediction(userId);
      return prediction;
    }

    const latestBudgetPlan = budgetPlan[budgetPlan.length - 1];
    return latestBudgetPlan;
  } catch (err) {
    return {
      error: "Failed to retrieve budget plan from database",
    };
  }
};

const budgetPlanHandler = async (request, h) => {
  const userId = request.params.id;

  try {
    const prediction = await getPredictionFromDatabase(userId);
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

module.exports = { budgetPlanHandler };
