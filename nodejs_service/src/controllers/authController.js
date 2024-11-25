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
  const idToken = request.headers.authorization.split("Bearer ")[1];

  try {
    // Verifikasi token ID menggunakan Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Mengambil data user dari Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return h.response({ error: "User not found" }).code(404);
    }

    return h.response({ message: "Login successful", uid: userId }).code(200);
  } catch (error) {
    return h.response({ error: "Invalid token" }).code(401);
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
