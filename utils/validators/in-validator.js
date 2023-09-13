const ethers = require("ethers");
const {
  getAllExistingTransactionsFromLogs,
  getLatestTokenBlock,
} = require("../../queries/transaction-logs");
const {
  processInDeposit,
  processInWithdrawal,
} = require("../../services/in-services");
const { IN_CONTRACT_ABI } = require("../constants");
const { sleep } = require("../sleep");
let lastInBlock = 0;
const MAX_BLOCK_NUMBER = 999999999999999;

module.exports.InValidator = async () => {
  const provider = new ethers.providers.WebSocketProvider(
    `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_IN_API_KEY}`
  );

  const InContract = new ethers.Contract(
    process.env.IN_CONTRACT_ADDRESS,
    IN_CONTRACT_ABI,
    provider
  );

  const depositAddress = InContract.filters.Transfer(
    null,
    process.env.IN_CONTRACT_OWNER_ADDRESS
  );

  if (lastInBlock < 1) {
    lastInBlock = await getLatestTokenBlock("IN");
  }

  const withdrawAddress = InContract.filters.Transfer(
    "0x0000000000000000000000000000000000000000",
    null
  );

  const depositTxns = await InContract.queryFilter(
    depositAddress,
    lastInBlock,
    MAX_BLOCK_NUMBER
  );

  const withdrawTxns = await InContract.queryFilter(
    withdrawAddress,
    lastInBlock,
    MAX_BLOCK_NUMBER
  );

  if (depositTxns.length <= 0 && withdrawTxns.length <= 0) return;

  await sleep(5000);

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
      (txn) => !allExistingTxns.includes(txn)
    );

    if (unprocessedDeposits.length <= 0) return;

    const processTxns = async () => {
      for (const depositsTxn of unprocessedDeposits) {
        const { sender, value, transactionHash, block } =
          newDepositTxnDetails.find(
            (txn) => txn.transactionHash === depositsTxn
          );

        const depositDetails = {
          iro: value,
          txnHash: transactionHash,
          block,
        };

        const { status } = await processInDeposit(sender, depositDetails);

        if (status === 200) {
          console.log(
            `[IN - Deposit Validator]: Transaction ${transactionHash} is completed.`
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

    const processWithdrawalTxns = async () => {
      for (const depositsTxn of unprocessedDeposits) {
        const { sender, value, transactionHash, block } =
          newWithdrawalnTxnDetails.find(
            (txn) => txn.transactionHash === depositsTxn
          );

        const withdrawalDetails = {
          iro: value,
          txnHash: transactionHash,
          tokenType: "IRO",
          block,
        };

        const { status } = await processInWithdrawal(sender, withdrawalDetails);

        if (status === 200) {
          console.log(
            `[IN - Withdrawal Validator]: Transaction ${transactionHash} is completed.`
          );
        }
      }
    };

    processWithdrawalTxns();
  }

  const allTxns = [...depositTxns, ...withdrawTxns];
  const allBlocks = allTxns.map((txns) => txns.blockNumber);
  lastInBlock = allBlocks.sort().pop() + 1;

  console.log(`[IN VALIDATOR - block: ${lastInBlock}]]`);
  return;
};
