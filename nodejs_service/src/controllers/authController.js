const { admin, db } = require("../utils/firebase");

// Registration Handler
const registerHandler = async (request, h) => {
  const { email, password } = request.payload;

  try {
    const UserRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Add User Email to Database
    await db.collection("users").doc(UserRecord.uid).collection("profile").doc("details").set({
      email,
    });

    return h
      .response({
        message: "User Registration Success",
        uid: UserRecord.uid,
      })
      .code(201);
  } catch (err) {
    return h
      .response({
        status: "failed",
        message: err.message,
      })
      .code(400);
  }
};

// Login Handler
const loginHandler = async (request, h) => {
  const { email, password } = request.payload;

  try {
    // Authentication user by using email
    const user = await admin.auth().getUserByEmail(email);

    // Create Token for User
    const token = await admin.auth().createCustomToken(user.uid);

    return h
      .response({
        status: "success",
        message: "Login successful",
        token,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "error",
        message: error.message,
      })
      .code(401);
  }
};

const loginUserWithGoogle = async (request, h) => {
  const idToken = request.headers.authorization.split("Bearer ")[1];

  try {
    // Verify Token From SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user if does not exist create new user
    const userDoc = await db.collection("users").doc(userId).collection("profile").doc("details").get();
    if (!userDoc.exists) {
      await db.collection("users").doc(userId).collection("profile").doc("details").set({
        email: decodedToken.email,
      });
    }

    return h
      .response({
        status: "success",
        message: "Login with Google successful",
        uid: userId,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "error",
        message: "Invalid token",
      })
      .code(401);
  }
};

module.exports = { registerHandler, loginHandler, loginUserWithGoogle };
