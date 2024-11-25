require("dotenv").config();
const Hapi = require("@hapi/hapi");

// Initialize Routes Module
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/authRoutes");
const budgetPlanRoutes = require("./src/routes/budgetRoutes");
const monthlyReportRoutes = require("./src/routes/reportRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");

// Scheduled Task
const { scheduledTask } = require("./src/service/function");

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "localhost",
  });

  const routes = [...authRoutes, ...userRoutes, ...budgetPlanRoutes, ...monthlyReportRoutes, ...transactionRoutes];
  routes.forEach((route) => {
    server.route(route);
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);

  scheduledTask();
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
