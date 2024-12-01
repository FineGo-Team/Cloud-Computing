const { db } = require("../utils/firebase");
const { FieldValue } = require("firebase-admin").firestore;

const addTransaction = async (request, h) => {
  const userId = request.params.id;
  const transactionData = request.payload;

  try {
    const transactionDate = new Date(transactionData.transaction_date || new Date()).toISOString();
    const month = transactionDate.slice(0, 7); // Ambil YYYY-MM dari tanggal transaksi

    const monthlyDocRef = db.collection("users").doc(userId).collection("monthly_transactions").doc(month);

    await monthlyDocRef.set(
      {
        transactions: FieldValue.arrayUnion({
          ...transactionData,
          transaction_date: transactionDate, // memastikan format tanggal ISO
        }),
      },
      { merge: true }
    );

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
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(currentMonth);

    const monthlyDocRef = await db.collection("users").doc(userId).collection("monthly_transactions").doc(currentMonth).get();

    if (!monthlyDocRef.exists) {
      return h
        .response({
          status: "success",
          data: [],
          message: "No transactions found for the specified month.",
        })
        .code(200);
    }

    const transactions = monthlyDocRef.data().transactions || [];

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
        message: "Failed to retrieve transactions",
      })
      .code(500);
  }
};

module.exports = { addTransaction, getTransactions };
