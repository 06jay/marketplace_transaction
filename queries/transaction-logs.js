const connection = require("../db/db");

module.exports.getAllExistingTransactionsFromLogs = async (
  transactionHashes
) => {
  try {
    const sanitizedHashes = transactionHashes.map((txn) => `\"${txn}\"`);
    const [existingProcessedTransaction, _e] = await connection.execute(
      `SELECT transaction_hash FROM iro_transaction_log_wd  WHERE transaction_hash IN(${sanitizedHashes});`
    );

    const existingTransactionHashes = existingProcessedTransaction.map(
      (data) => `${data.transaction_hash?.toLowerCase()}`
    );

    return existingTransactionHashes;
  } catch (e) {
    console.log(e);
  }
};

module.exports.getLatestTokenBlock = async (tokenType) => {
  try {
    const [latestBlock, _e] = await connection.execute(
      `SELECT details->'$.block' as blockNumber FROM iro_transaction_log_wd where details->'$.block' IS NOT NULL AND currency LIKE '%${tokenType}%' ORDER BY details->'$.block' DESC LIMIT 1 ;`
    );

    if (latestBlock[0]?.blockNumber) {
      return latestBlock[0]?.blockNumber + 1;
    } else {
      if (tokenType.toLowerCase() === "zeny") {
        return Number(process.env.LAST_ZENY_BLOCK) || 0;
      } else if (tokenType.toLowerCase() === "in") {
        return Number(process.env.LAST_IN_BLOCK) || 0;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
