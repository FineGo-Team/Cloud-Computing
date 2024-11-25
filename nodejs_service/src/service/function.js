const cron = require("node-cron");
const { db } = require("../utils/firebase");
const { getBudgetPlanPrediction } = require("./budgetController");
const { generateMonthlyReport } = require("./monthlyReportController");

const scheduleTasks = () => {
  // Scheduling for Monthly report Prediction
  cron.schedule("0 0 0 L * *", async () => {
    console.log("Running scheduled task for Monthly Report");

    const usersSnapshot = await db.collection("users").get();
    usersSnapshot.forEach(async (userDoc) => {
      await generateMonthlyReport(userDoc.id);
    });
  });

  // Scheduling For Budget Plan Predictions
  cron.schedule("0 0 1 * *", async () => {
    console.log("Running schedule Task");

    const usersSnapshot = await db.collection("users").get();
    usersSnapshot.forEach((userDoc) => {
      getBudgetPlanPrediction(userDoc.id);
    });
  });
};

// Get User age For Calculate Prediction
const getUserAge = (birthdate) => {
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

module.exports = { getUserAge, scheduleTasks };
