const budgetPlanController = require("../controllers/budgetController");

const budgetPlanRoutes = [
  {
    method: "GET",
    path: "/user/{id}/budget-plan",
    handler: budgetPlanController.budgetPlanHandler,
  },
];

module.exports = budgetPlanRoutes;
