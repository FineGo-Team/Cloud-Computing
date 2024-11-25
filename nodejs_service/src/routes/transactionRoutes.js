const transactionController = require("../controllers/transactionController");

const transactionRoutes = [
  {
    method: "POST",
    path: "/user/{id}/transactions",
    handler: transactionController.addTransaction,
  },
  {
    method: "GET",
    path: "/user/{id}/transactions",
    handler: transactionController.getTransactions,
  },
];

module.exports = transactionRoutes;
