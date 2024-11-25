const { db } = require("../utils/firebase");

const addTransaction = async (request, h) => {
  const userId = request.params.id;
  const transactionData = request.payload;

  try {
    const newTransaction = db.collection("users").doc(userId).collection("transactions").doc();
    await newTransaction.set({
      ...transactionData,
      date: new Date(transactionData.date || new Date()),
    });

    return h
      .response({
        status: "success",
        message: "Transaction added successfully",
      })
      .code(201);
  } catch (err) {
    return h
      .response({
        status: "failed",
        message: "Failed to add transaction",
      })
      .code(500);
  }
};

const getTransactions = async (request, h) => {
  const userId = request.params.id;

  try {
    const transactionsSnapshot = await db.collection("users").doc(userId).collection("transactions").get();
    const transactions = {};

    transactionsSnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...data() });
    });

    return h
      .response({
        status: "success",
        data: transactions,
      })
      .code(200);
  } catch (err) {
    return h
      .response({
        status: "error",
        message: "Failed to retrieve transaction",
      })
      .code(500);
  }
};

module.exports = { addTransaction, getTransactions };
