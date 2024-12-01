const budgetPlanController = require("../controllers/budgetPlanController");

const budgetPlanRoutes = [
  {
    method: "GET",
    path: "/user/{id}/budget-plan",
    handler: budgetPlanController.budgetPlanHandler,
  },
];

module.exports = budgetPlanRoutes;
