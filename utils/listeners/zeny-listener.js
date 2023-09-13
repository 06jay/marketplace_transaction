const ethers = require("ethers");
const { ZENY_CONTRACT_ABI } = require("../constants");
const moment = require("moment-timezone");
const {
  processZenyDeposit,
  processZenyWithdrawal,
} = require("../../services/zeny-services");
const { sleep } = require("../sleep");

let ZenyContract = null;

module.exports.ZenyTransactionListener = async () => {
  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ZENY_API_KEY}`
  );

  ZenyContract = new ethers.Contract(
    process.env.ZENY_CONTRACT_ADDRESS,
    ZENY_CONTRACT_ABI,
    provider
  );

  ZenyContract.on("Transfer", async (sender, receiverAddress, value, event) => {
    try {
      const isDepositTransaction =
        receiverAddress === process.env.ZENY_CONTRACT_BURN_ADDRESS;

      const isWithdrawal =
        sender === "0x0000000000000000000000000000000000000000";

      await sleep(5000);
      if (isDepositTransaction) {
        const depositDetails = {
          zeny: parseFloat(ethers.utils.formatUnits(value, 18)),
          txnHash: event.transactionHash,
        };

        await processZenyDeposit(sender, depositDetails);
      } else if (isWithdrawal) {
        const withdrawalDetails = {
          zeny: parseFloat(ethers.utils.formatUnits(value, 18)),
          txnHash: event.transactionHash,
          tokenType: "ZENY",
        };
        await processZenyWithdrawal(receiverAddress, withdrawalDetails);
      }
    } catch (error) {
      console.log({ error });
    }
  });

  console.log(
    `[Contract-ZENY-${moment(new Date())
      .tz("Asia/Manila")
      .format("MM/DD/YYYY-HH:mm:ss")}]: Transaction listener is running...`
  );
};
