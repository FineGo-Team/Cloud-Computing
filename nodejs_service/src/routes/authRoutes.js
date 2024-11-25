const authController = require("../controllers/authController");

const authRoutes = [
  {
    method: "POST",
    path: "/auth/register",
    handler: authController.registerHandler,
  },
  {
    method: "POST",
    path: "/auth/login",
    handler: authController.loginHandler,
  },
  {
    method: "POST",
    path: "/auth/google-login",
    handler: authController.loginUserWithGoogle,
  },
];

module.exports = authRoutes;
