const ethers = require("ethers");
const { USDT_CONTRACT_ABI } = require("../constants");
const moment = require("moment-timezone");

const { sleep } = require("../sleep");
const offeringQuery = require("../../queries/offeringsQuery");
const { processUsdtPayment } = require("../../services/usdt-services");
const isListenerEnabled =
  process.env.ENABLE_USDT_LISTENER === "true" ||
  process.env.ENABLE_USDT_LISTENER === true;

let UsdtContract = null;

module.exports.UsdtTransactionListener = async () => {
  if (!isListenerEnabled) return;

  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_USDT_API_KEY}`
  );

  UsdtContract = new ethers.Contract(
    process.env.USDT_CONTRACT_ADDRESS,
    USDT_CONTRACT_ABI,
    provider
  );

  UsdtContract.on("Transfer", async (sender, receiverAddress, value, event) => {
    try {
      const isDepositTransaction =
        receiverAddress === process.env.USDT_CONTRACT_OWNER_ADDRESS;

      await sleep(5000);
      if (isDepositTransaction) {
        const pendingTransactionDetails =
          await offeringQuery.getUserPendingTransaction(
            sender,
            event.transactionHash
          );

        const userDetails = await offeringQuery.getUserDetails(sender);

        const txnDetails = {
          buyerId: userDetails?.account_id,
          txnHash: event.transactionHash,
          quantity: pendingTransactionDetails?.quantity,
        };

        await processUsdtPayment(
          pendingTransactionDetails?.item_id,
          txnDetails
        );
      }
    } catch (error) {
      console.log({ error });
    }
  });

  console.log(
    `[Contract-USDT-${moment(new Date())
      .tz("Asia/Manila")
      .format("MM/DD/YYYY-HH:mm:ss")}]: Transaction listener is running...`
  );
};
