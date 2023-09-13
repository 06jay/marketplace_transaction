const connection = require("../db/db");
module.exports.getUserPendingTransaction = async (userWallet, txnHash) => {
  try {
    const [items] = await connection.execute(
      `
            SELECT id, user_wallet, item_id, quantity
            FROM iro_offerings_transactions 
            WHERE user_wallet=?
              AND is_claimed = 0
              AND is_expired = 0
              AND transaction_hash = ?
          `,
      [userWallet, txnHash]
    );

    return items[0];
  } catch (err) {
    throw err;
  }
};

module.exports.getAllCompletedTransaction = async (transactionHashes) => {
  try {
    const sanitizedHashes = transactionHashes.map((txn) => `\"${txn}\"`);
    const [existingProcessedTransaction, _e] = await connection.execute(
      `SELECT transaction_hash FROM iro_marketplace_noti_log WHERE transaction_hash IN(${sanitizedHashes}) AND currency='USDT';`
    );

    const existingTransactionHashes = existingProcessedTransaction.map(
      (data) => `${data.transaction_hash?.toLowerCase()}`
    );

    return existingTransactionHashes;

    // const [items] = await connection.execute(
    //   `
    //           SELECT *
    //           FROM iro_offerings_transactions
    //           WHERE is_claimed = 0
    //             AND is_expired = 0
    //         `,
    //   []
    // );

    // return items[0];
  } catch (err) {
    throw err;
  }
};

module.exports.getUserDetails = async (userWallet) => {
  try {
    const [items] = await connection.execute(
      `
              SELECT account_id, wallet
              FROM login 
              WHERE wallet=?
        `,
      [userWallet]
    );

    return items[0];
  } catch (err) {
    throw err;
  }
};
