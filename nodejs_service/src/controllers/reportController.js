const axios = require("axios");
const { db } = require("../utils/firebase");
const path = require("path");
const { getUserAge } = "../service/function";

const getMonthlyReport = async (userId) => {
  try {
    // Put User Profile Information from database
    const profileDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();

    if (!profileDoc.exists) {
      console.log("Profile not Found");
      return;
    }

    const profile = profileDoc.data();
    const age = profile ? getUserAge(profile.birthDate) : null;

    // Initialize Variables for User Expenses
    let food_expenses = 0;
    let transport_expenses = 0;
    let housing_cost = 0;
    let electricity_bill = 0;
    let water_bill = 0;
    let internet_cost = 0;
    let debt = 0;
    let total_expenses = 0;

    // Initialize variables for User Income
    let income = 0;

    const transactionSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .where("date", ">=", new Date(new Date().setDate(1)))
      .where("date", "<", newDate())
      .get();

    // Calculate User Income and Expenses from Transactions Collection
    if (!transactionSnapshot.empty) {
      transactionSnapshot.forEach((doc) => {
        const transactions = doc.date();
        if (transactions.type === "income") {
          income += transactions.amount || 0;
        } else if (transactions.type === "expense") {
          total_expenses += transactions.amount || 0;
          if (transactions.category === "food_expense") food_expenses += transactions.amount || 0;
          if (transactions.category === "transportation_expense") transport_expenses += transactions.amount || 0;
          if (transactions.category === "housing_cost") housing_cost += transactions.amount || 0;
          if (transactions.category === "electricity_bill") electricity_bill += transactions.amount || 0;
          if (transactions.category === "water_bill") water_bill += transactions.amount || 0;
          if (transactions.category === "internet_cost") internet_cost += transactions.amount || 0;
          if (transactions.category === "debt") debt += transactions.amount || 0;
        }
      });
    }

    const savings = income - total_expenses;

    // Initialize Input Data for Model Machine Learning
    const inputDate = {
      age,
      income,
      food_expenses,
      transport_expenses,
      housing_cost,
      water_bill,
      electricity_bill,
      internet_cost,
      debt,
      savings,
    };

    // TODO: Fill the Flask Endpoint URL
    const flaskEndpoint = "http://127.0.0.1:5000/monthly_report";
    const response = await axios.post(flaskEndpoint, inputDate);
    const result = response.data;

    const monthyReport = await db
      .collection("users")
      .doc(userId)
      .collection("predictions")
      .doc("monthly_report")
      .update({
        reports: db.firestore.FieldValue.arrayUnion({
          date: new Date(),
          ...result,
        }),
      });

    return monthyReport;
  } catch (err) {
    throw new Error("Error generating monthly report");
  }
};

const monthlyReportHandler = async (request, h) => {
  const userId = request.params.id;
  try {
    const reportDoc = await db.collection("users").doc(userId).collection("predictions").doc("monthly_report").get();
    const reports = reportDoc.data().reports;
    if (!reportDoc.exists || reports.length === 0) {
      const report = await generateMonthlyReport(userId);
      return h.response({ report }).code(201);
    }
    return h.response({ reports }).code(200);
  } catch (error) {
    return h.response({ error: "Failed to retrieve monthly report" }).code(500);
  }
};

module.exports = monthlyReportHandler;
