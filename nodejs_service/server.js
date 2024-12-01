require("dotenv").config();
const Hapi = require("@hapi/hapi");
// Initialize Routes Module
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const budgetPlanRoutes = require("./src/routes/budgetRoutes");
const monthlyReportRoutes = require("./src/routes/reportRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");

// Scheduled Task
const { scheduledTask } = require("./src/service/function");

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: "0.0.0.0",
  });

  const routes = [...authRoutes, ...userRoutes, ...budgetPlanRoutes, ...monthlyReportRoutes, ...transactionRoutes];
  routes.forEach((route) => {
    server.route(route);
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
