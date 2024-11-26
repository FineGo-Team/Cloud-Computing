const monthlyReportHandler = require("../controllers/reportController");

const monthlyReportRoutes = [
  {
    method: "GET",
    path: "/user/{id}/monthly-report",
    handler: monthlyReportHandler,
  },
];

module.exports = monthlyReportRoutes;
