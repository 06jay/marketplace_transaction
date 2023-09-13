const ethers = require("ethers");
const { IN_CONTRACT_ABI } = require("../constants");
const moment = require("moment-timezone");
const { sleep } = require("../sleep");
const {
  processInDeposit,
  processInWithdrawal,
} = require("../../services/in-services");

let InContract = null;

module.exports.InTransactionListner = async () => {
  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_IN_API_KEY}`
  );

  InContract = new ethers.Contract(
    process.env.IN_CONTRACT_ADDRESS,
    IN_CONTRACT_ABI,
    provider
  );

  InContract.on("Transfer", async (sender, receiverAddress, value, event) => {
    try {
      const isDepositTransaction =
        receiverAddress === process.env.IN_CONTRACT_OWNER_ADDRESS;

      const isWithdrawal =
        sender === "0x0000000000000000000000000000000000000000";

      await sleep(5000);

      if (isDepositTransaction) {
        const depositDetails = {
          iro: parseFloat(ethers.utils.formatUnits(value, 18)),
          txnHash: event.transactionHash,
        };

        await processInDeposit(sender, depositDetails);
      } else if (isWithdrawal) {
        const withdrawalDetails = {
          iro: parseFloat(ethers.utils.formatUnits(value, 18)),
          txnHash: event.transactionHash,
          tokenType: "IRO",
        };

        await processInWithdrawal(receiverAddress, withdrawalDetails);
      }
    } catch (error) {
      console.log({ error });
    }
  });

  console.log(
    `[Contract-IN-${moment(new Date())
      .tz("Asia/Manila")
      .format("MM/DD/YYYY-HH:mm:ss")}]: Transaction listener is running...`
  );
};
