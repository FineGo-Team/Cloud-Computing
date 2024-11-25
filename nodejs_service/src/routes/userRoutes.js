const userController = require("../controllers/userController");

const userRoutes = [
  {
    method: "GET",
    path: "/user/{id}/profile",
    handler: userController.getUserProfile,
  },
  {
    method: "POST",
    path: "/user/{id}/input-user-info",
    handler: userController.inputUserInfo,
  },
];

module.exports = userRoutes;
