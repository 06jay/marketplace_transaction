const ethers = require("ethers");
const {
  getAllExistingTransactionsFromLogs,
  getLatestTokenBlock,
} = require("../../queries/transaction-logs");
const {
  processZenyDeposit,
  processZenyWithdrawal,
} = require("../../services/zeny-services");
const { ZENY_CONTRACT_ABI } = require("../constants");
const { sleep } = require("../sleep");

let lastZenyBlock = 0;
const MAX_BLOCK_NUMBER = 999999999999999;

module.exports.ZenyValidator = async () => {
  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ZENY_API_KEY}`
  );

  const ZenyContract = new ethers.Contract(
    process.env.ZENY_CONTRACT_ADDRESS,
    ZENY_CONTRACT_ABI,
    provider
  );

  const depositAddress = ZenyContract.filters.Transfer(
    null,
    process.env.ZENY_CONTRACT_BURN_ADDRESS
  );

  const withdrawAddress = ZenyContract.filters.Transfer(
    "0x0000000000000000000000000000000000000000",
    null
  );

  if (lastZenyBlock < 1) {
    lastZenyBlock = await getLatestTokenBlock("ZENY");
  }

  const depositTxns = await ZenyContract.queryFilter(
    depositAddress,
    lastZenyBlock,
    MAX_BLOCK_NUMBER
  );

  const withdrawTxns = await ZenyContract.queryFilter(
    withdrawAddress,
    lastZenyBlock,
    MAX_BLOCK_NUMBER
  );

  if (depositTxns.length <= 0 && withdrawTxns.length <= 0) return;

  await sleep(10000);

  if (depositTxns.length > 0) {
    const newDepositTxnHash = depositTxns?.map(
      (deposits) => `${deposits.transactionHash.toLowerCase()}`
    );

    const newDepositTxnDetails = depositTxns.map((txn) => ({
      block: txn.blockNumber,
      transactionHash: txn.transactionHash,
      sender: txn.args.from,
      receiverAddress: txn.args.to,
      value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
    }));

    const allExistingTxns = await getAllExistingTransactionsFromLogs(
      newDepositTxnHash
    );

    const unprocessedDeposits = newDepositTxnHash.filter(
      (txn) => !allExistingTxns?.includes(txn)
    );

    if (unprocessedDeposits.length <= 0) return;

    const processTxns = async () => {
      for (const depositsTxn of unprocessedDeposits) {
        const { sender, value, transactionHash, block } =
          newDepositTxnDetails.find(
            (txn) => txn.transactionHash === depositsTxn
          );

        const depositDetails = {
          zeny: value,
          txnHash: transactionHash,
          block,
        };

        const { status } = await processZenyDeposit(sender, depositDetails);

        if (status === 200) {
          console.log(
            `[ZENY - Deposit Validator]: Transaction ${transactionHash} is completed.`
          );
        }
      }
    };

    processTxns();
  }

  if (withdrawTxns.length > 0) {
    const newWithdrawalTxnHash = withdrawTxns?.map(
      (withdrawals) => `${withdrawals.transactionHash.toLowerCase()}`
    );

    const newWithdrawalnTxnDetails = withdrawTxns.map((txn) => ({
      block: txn.blockNumber,
      transactionHash: txn.transactionHash,
      sender: txn.args.from,
      receiverAddress: txn.args.to,
      value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
    }));

    const allExistingTxns = await getAllExistingTransactionsFromLogs(
      newWithdrawalTxnHash
    );

    const unprocessedDeposits = newWithdrawalTxnHash.filter(
      (txn) => !allExistingTxns.includes(txn)
    );

    const processWithdrawlTxns = async () => {
      for (const depositsTxn of unprocessedDeposits) {
        const { sender, value, transactionHash, block } =
          newWithdrawalnTxnDetails.find(
            (txn) => txn.transactionHash === depositsTxn
          );

        const withdrawalDetails = {
          zeny: value,
          txnHash: transactionHash,
          tokenType: "ZENY",
          block,
        };

        const { status } = await processZenyWithdrawal(
          sender,
          withdrawalDetails
        );

        if (status === 200) {
          console.log(
            `[ZENY - Withdrawal Validator]: Transaction ${transactionHash} is completed.`
          );
        }
      }
    };

    processWithdrawlTxns();
  }

  const allTxns = [...depositTxns, ...withdrawTxns];
  const allBlocks = allTxns.map((txns) => txns.blockNumber);
  lastZenyBlock = allBlocks.sort().pop() + 1;

  console.log(`[ZENY VALIDATOR - block: ${lastZenyBlock}]]`);
  return;
};
