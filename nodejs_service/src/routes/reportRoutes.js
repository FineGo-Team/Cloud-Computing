const monthlyReportController = require("../controllers/reportController");

const monthlyReportRoutes = [
  {
    method: "GET",
    path: "/user/{id}/monthly-report",
    handler: monthlyReportController.monthlyReportHandler,
  },
];

module.exports = monthlyReportRoutes;
