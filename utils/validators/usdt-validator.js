const ethers = require("ethers");

const offeringQuery = require("../../queries/offeringsQuery");
const { processUsdtPayment } = require("../../services/usdt-services");
const { USDT_CONTRACT_ABI } = require("../constants");
const { sleep } = require("../sleep");
let lastUsdtBlock = Number(process.env.LAST_USDT_BLOCK) || 36618993;
const MAX_BLOCK_NUMBER = 999999999999999;
const isValidatorEnabled =
  process.env.ENABLE_USDT_LISTENER === "true" ||
  process.env.ENABLE_USDT_LISTENER === true;

module.exports.UsdtValidator = async () => {
  if (!isValidatorEnabled) return;

  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_USDT_API_KEY}`
  );

  const UsdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ADDRESS,
    USDT_CONTRACT_ABI,
    provider
  );

  const depositAddress = UsdtContract.filters.Transfer(
    null,
    process.env.USDT_CONTRACT_OWNER_ADDRESS
  );

  const paymentTxns = await UsdtContract.queryFilter(
    depositAddress,
    lastUsdtBlock,
    MAX_BLOCK_NUMBER
  );

  if (paymentTxns.length <= 0) return;

  await sleep(9000);

  if (paymentTxns.length > 0) {
    const paymentTxnHashes = paymentTxns?.map(
      (payment) => `${payment.transactionHash.toLowerCase()}`
    );

    const newPaymentTxnDetails = paymentTxns.map((txn) => ({
      block: txn.blockNumber,
      transactionHash: txn.transactionHash,
      sender: txn.args.from,
      receiverAddress: txn.args.to,
    }));

    const allProcessedPaymentTxns =
      await offeringQuery.getAllCompletedTransaction(paymentTxnHashes);

    const unprocessedPayments = paymentTxnHashes.filter(
      (txn) => !allProcessedPaymentTxns.includes(txn)
    );

    if (unprocessedPayments.length <= 0) return;

    const processTxns = async () => {
      for (const depositsTxn of unprocessedPayments) {
        const { sender, value, transactionHash, block } =
          newPaymentTxnDetails.find(
            (txn) => txn.transactionHash === depositsTxn
          );

        const pendingTransactionDetails =
          await offeringQuery.getUserPendingTransaction(
            sender,
            transactionHash
          );

        const userDetails = await offeringQuery.getUserDetails(sender);

        const txnDetails = {
          buyerId: userDetails?.account_id,
          txnHash: transactionHash,
          quantity: pendingTransactionDetails?.quantity,
        };

        const { status } = await processUsdtPayment(
          pendingTransactionDetails?.item_id,
          txnDetails
        );

        if (status === 200) {
          console.log(
            `[USDT - Payment Validator]: Transaction ${transactionHash} is completed.`
          );
        }
      }
    };

    processTxns();
  }

  const allBlocks = paymentTxns.map((txns) => txns.blockNumber);
  lastUsdtBlock = allBlocks.sort().pop() + 1;

  console.log(`[USDT VALIDATOR - block: ${lastUsdtBlock}]]`);
  return;
};
