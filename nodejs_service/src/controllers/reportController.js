const axios = require("axios");
const { db } = require("../utils/firebase");
const { getUserAge } = require("../service/function");
const { FieldValue } = require("firebase-admin").firestore;

// Handler to Send Request to Model API Server
const getMonthlyReport = async (userId) => {
  try {
    const profileDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();

    if (!profileDoc.exists) {
      console.log("Profile not Found");
      return;
    }

    const profile = profileDoc.data();
    const age = profile ? getUserAge(profile.birthdate) : null;

    let food_expenses = 0;
    let transportation_expenses = 0;
    let housing_cost = 0;
    let electricity_bill = 0;
    let water_bill = 0;
    let internet_cost = 0;
    let debt = 0;
    let income = 0;

    const currentDate = new Date();
    const currentMonthStr = currentDate.toISOString().slice(0, 7); // Format YYYY-MM

    const monthlyDocRef = await db.collection("users").doc(userId).collection("monthly_transactions").doc(currentMonthStr).get();

    if (!monthlyDocRef.exists || !monthlyDocRef.data().transactions) {
      const expenseQuerySnapshot = await db.collection("users").doc(userId).collection("expenses").orderBy("timestamp", "desc").limit(1).get();
      const incomeQuerySnapshot = await db.collection("users").doc(userId).collection("income").orderBy("timestamp", "desc").limit(1).get();

      const userExpense = expenseQuerySnapshot.empty ? {} : expenseQuerySnapshot.docs[0].data();
      const userIncome = incomeQuerySnapshot.empty ? {} : incomeQuerySnapshot.docs[0].data();

      food_expenses = userExpense.food_expenses || 0;
      transportation_expenses = userExpense.transportation_expenses || 0;
      housing_cost = userExpense.housing_cost || 0;
      electricity_bill = userExpense.electricity_bill || 0;
      water_bill = userExpense.water_bill || 0;
      internet_cost = userExpense.internet_cost || 0;
      debt = userExpense.debt || 0;
      income = userIncome.total_income || 0;
    } else {
      const transactions = monthlyDocRef.data().transactions;

      // Calculate transaction amount user In This month
      transactions.forEach((transaction) => {
        if (transaction.type === "income") {
          income += transaction.amount || 0;
        } else if (transaction.type === "expense") {
          if (transaction.category === "food_expenses") food_expenses += transaction.amount || 0;
          if (transaction.category === "transportation_expenses") transportation_expenses += transaction.amount || 0;
          if (transaction.category === "housing_cost") housing_cost += transaction.amount || 0;
          if (transaction.category === "electricity_bill") electricity_bill += transaction.amount || 0;
          if (transaction.category === "water_bill") water_bill += transaction.amount || 0;
          if (transaction.category === "internet_cost") internet_cost += transaction.amount || 0;
          if (transaction.category === "debt") debt += transaction.amount || 0;
        }
      });
    }

    const total_expenses = food_expenses + transportation_expenses + housing_cost + electricity_bill + water_bill + internet_cost + debt;
    const savings = income - total_expenses;

    // Categorizing for user Highest Expenses
    const expensesArray = [
      { category: "food_expenses", amount: food_expenses },
      { category: "transportation_expenses", amount: transportation_expenses },
      { category: "housing_cost", amount: housing_cost },
      { category: "electricity_bill", amount: electricity_bill },
      { category: "water_bill", amount: water_bill },
      { category: "internet_cost", amount: internet_cost },
      { category: "debt", amount: debt },
    ];

    expensesArray.sort((a, b) => b.amount - a.amount);
    const highestExpenses = expensesArray.slice(0, 2);

    const inputData = {
      province: profile.province.toUpperCase(),
      age,
      income,
      food_expenses,
      transportation_expenses,
      housing_cost,
      water_bill,
      electricity_bill,
      internet_cost,
      debt,
      savings,
    };

    console.log(inputData);

    const flaskEndpoint = "https://model-api-196246270808.asia-southeast2.run.app/monthly_report";
    const response = await axios.post(flaskEndpoint, { inputData });
    const result = response.data;

    // Save Monthly Report to Database
    const monthlyReport = await db
      .collection("users")
      .doc(userId)
      .collection("predictions")
      .doc("monthly_report")
      .set(
        {
          reports: FieldValue.arrayUnion({
            date: new Date().toISOString(),
            ...result,
            highest_expenses: highestExpenses,
          }),
        },
        { merge: true }
      );

    // Save This Month User Income to Database
    await db.collection("users").doc(userId).collection("income").doc(currentMonthStr).set(
      {
        total_income: income,
        savings,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );

    // Save This Month User Expenses to Database
    await db.collection("users").doc(userId).collection("expenses").doc(currentMonthStr).set(
      {
        food_expenses,
        transportation_expenses,
        housing_cost,
        water_bill,
        electricity_bill,
        internet_cost,
        debt,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );

    return monthlyReport;
  } catch (err) {
    throw new Error("Error generating monthly report: " + err.message);
  }
};

// Monthly Report Handler For Return Monthly Report to Users
const monthlyReportHandler = async (request, h) => {
  const userId = request.params.id;
  try {
    let reportDoc = await db.collection("users").doc(userId).collection("predictions").doc("monthly_report").get();
    const reports = reportDoc.exists ? reportDoc.data().reports || [] : [];

    if (!reportDoc.exists || reports.length === 0) {
      await getMonthlyReport(userId);
      reportDoc = await db.collection("users").doc(userId).collection("predictions").doc("monthly_report").get();
      const report = reports[0];
      return h
        .response({
          finance_report: report,
        })
        .code(201);
    }

    // Sort and Take User New Reports
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestReport = reports[0];

    return h
      .response({
        finance_report: latestReport,
      })
      .code(200);
  } catch (error) {
    console.log(error);
    return h
      .response({
        error: "Failed to retrieve monthly report",
      })
      .code(500);
  }
};

module.exports = { monthlyReportHandler, getMonthlyReport };
