// const ethers = require("ethers");
// const {
//   ZENY_handleSuccessfulDeposit,
//   IN_handleSuccessfulDeposit,
//   IN_handleSuccessfulWithdrawal,
//   ZENY_handleSuccessfulWithdrawal,
//   getAllExistingTransactionsFromLogs,
// } = require("../controllers/tokenController");
// const {
//   addWithdrawDepositLog,
// } = require("../controllers/transactionsController");
// const { IN_CONTRACT_ABI, ZENY_CONTRACT_ABI } = require("./constants");
// const moment = require("moment-timezone");

// let ZenyContract = null;
// let InContract = null;

// const defaultZenyBlock = Number(process.env.LAST_ZENY_BLOCK) || 0;
// const defaultInBlock = Number(process.env.LAST_IN_BLOCK) || 0;

// let lastZenyBlock = defaultZenyBlock;

// let lastInBlock = defaultInBlock;

// const MAX_BLOCK_NUMBER = 999999999999999;

// const IN_TransactionListener = async () => {
//   if (InContract) {
//     InContract.removeAllListeners();
//     InContract = null;
//   }

//   const provider = new ethers.providers.WebSocketProvider(
//     `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_IN_API_KEY}`
//   );

//   InContract = new ethers.Contract(
//     process.env.IN_CONTRACT_ADDRESS,
//     IN_CONTRACT_ABI,
//     provider
//   );

//   InContract.on("Transfer", async (sender, receiverAddress, value, event) => {
//     try {
//       console.log({
//         type: "[IN] - CONTRACT ON",
//         sender,
//         receiverAddress,
//         value: parseFloat(ethers.utils.formatUnits(value, 18)),
//       });
//       const isDepositTransaction =
//         receiverAddress === process.env.IN_CONTRACT_OWNER_ADDRESS;

//       const isWithdrawal =
//         sender === "0x0000000000000000000000000000000000000000";

//       if (isDepositTransaction) {
//         const depositDetails = {
//           userWallet: sender,
//           amount: parseFloat(ethers.utils.formatUnits(value, 18)),
//           txnHash: event.transactionHash,
//         };

//         await IN_handleSuccessfulDeposit(depositDetails);
//       } else if (isWithdrawal) {
//         const withdrawalDetails = {
//           userWallet: receiverAddress,
//           amount: parseFloat(ethers.utils.formatUnits(value, 18)),
//           txnHash: event.transactionHash,
//           tokenType: "IRO",
//         };

//         await IN_handleSuccessfulWithdrawal(withdrawalDetails);
//       }
//     } catch (error) {
//       console.log({ error });

//       await addWithdrawDepositLog({
//         account_id: 111111,
//         amount: 1,
//         currency: "ERR",
//         type: "IN",
//         previous_balance: 0,
//         txnHash: "TXN_HASH_ERROR",
//         details: JSON.stringify({
//           error,
//         }),
//       });
//     }
//   });

//   console.log(
//     `[Contract-IN-${moment(new Date())
//       .tz("Asia/Manila")
//       .format("MM/DD/YYYY-HH:mm:ss")}]: Transaction listener is running...`
//   );
// };

// const ZENY_TransactionListener = async () => {
//   if (ZenyContract) {
//     ZenyContract.removeAllListeners();
//     ZenyContract = null;
//   }

//   const provider = new ethers.providers.WebSocketProvider(
//     `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ZENY_API_KEY}`
//   );

//   ZenyContract = new ethers.Contract(
//     process.env.ZENY_CONTRACT_ADDRESS,
//     ZENY_CONTRACT_ABI,
//     provider
//   );

//   ZenyContract.on("Transfer", async (sender, receiverAddress, value, event) => {
//     try {
//       console.log({
//         type: "[ZENY] - CONTRACT ON",
//         sender,
//         receiverAddress,
//         value: parseFloat(ethers.utils.formatUnits(value, 18)),
//       });

//       const isDepositTransaction =
//         receiverAddress === process.env.ZENY_CONTRACT_BURN_ADDRESS;

//       const isWithdrawal =
//         sender === "0x0000000000000000000000000000000000000000";

//       if (isDepositTransaction) {
//         const depositDetails = {
//           userWallet: sender,
//           amount: parseFloat(ethers.utils.formatUnits(value, 18)),
//           txnHash: event.transactionHash,
//         };

//         await ZENY_handleSuccessfulDeposit(depositDetails);
//       } else if (isWithdrawal) {
//         const withdrawalDetails = {
//           userWallet: receiverAddress,
//           amount: parseFloat(ethers.utils.formatUnits(value, 18)),
//           txnHash: event.transactionHash,
//           tokenType: "ZENY",
//         };

//         await ZENY_handleSuccessfulWithdrawal(withdrawalDetails);
//       }
//     } catch (error) {
//       console.log({ error });

//       await addWithdrawDepositLog({
//         account_id: 111111,
//         amount: 1,
//         currency: "ERR",
//         type: "ZENY",
//         previous_balance: 0,
//         txnHash: "TXN_HASH_ERROR",
//         details: JSON.stringify({
//           error,
//         }),
//       });
//     }
//   });

//   console.log(
//     `[Contract-ZENY-${moment(new Date())
//       .tz("Asia/Manila")
//       .format("MM/DD/YYYY-HH:mm:ss")}]: Transaction listener is running...`
//   );
// };

// const IN_Validator = async () => {
//   if (lastInBlock < 1) {
//     console.log("Invalid LAST_IN_BLOCK value");
//     return;
//   }

//   const provider = new ethers.providers.WebSocketProvider(
//     `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ZENY_API_KEY}`
//   );

//   const InContract = new ethers.Contract(
//     process.env.IN_CONTRACT_ADDRESS,
//     IN_CONTRACT_ABI,
//     provider
//   );

//   const depositAddress = InContract.filters.Transfer(
//     null,
//     process.env.IN_CONTRACT_OWNER_ADDRESS
//   );

//   const withdrawAddress = InContract.filters.Transfer(
//     "0x0000000000000000000000000000000000000000",
//     null
//   );

//   const depositTxns = await InContract.queryFilter(
//     depositAddress,
//     lastInBlock,
//     MAX_BLOCK_NUMBER
//   );

//   const withdrawTxns = await InContract.queryFilter(
//     withdrawAddress,
//     lastInBlock,
//     MAX_BLOCK_NUMBER
//   );

//   if (depositTxns.length <= 0 && withdrawTxns.length <= 0) return;

//   if (depositTxns.length > 0) {
//     const newDepositTxnHash = depositTxns?.map(
//       (deposits) => `${deposits.transactionHash.toLowerCase()}`
//     );

//     const newDepositTxnDetails = depositTxns.map((txn) => ({
//       block: txn.blockNumber,
//       transactionHash: txn.transactionHash,
//       sender: txn.args.from,
//       receiverAddress: txn.args.to,
//       value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
//     }));

//     const allExistingTxns = await getAllExistingTransactionsFromLogs(
//       newDepositTxnHash
//     );

//     const unprocessedDeposits = newDepositTxnHash.filter(
//       (txn) => !allExistingTxns.includes(txn)
//     );

//     if (unprocessedDeposits.length <= 0) return;

//     const processTxns = async () => {
//       for (const depositsTxn of unprocessedDeposits) {
//         const { sender, value, transactionHash } = newDepositTxnDetails.find(
//           (txn) => txn.transactionHash === depositsTxn
//         );

//         const depositDetails = {
//           userWallet: sender,
//           amount: value,
//           txnHash: transactionHash,
//         };

//         const response = await IN_handleSuccessfulDeposit(depositDetails);

//         if (response === -1) {
//           console.log(
//             `[IN - Deposit Validator]: Transaction ${transactionHash} is completed.`
//           );
//         }
//       }
//     };

//     processTxns();
//   }

//   if (withdrawTxns.length > 0) {
//     const newWithdrawalTxnHash = withdrawTxns?.map(
//       (withdrawals) => `${withdrawals.transactionHash.toLowerCase()}`
//     );

//     const newWithdrawalnTxnDetails = withdrawTxns.map((txn) => ({
//       block: txn.blockNumber,
//       transactionHash: txn.transactionHash,
//       sender: txn.args.from,
//       receiverAddress: txn.args.to,
//       value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
//     }));

//     const allExistingTxns = await getAllExistingTransactionsFromLogs(
//       newWithdrawalTxnHash
//     );

//     const unprocessedDeposits = newWithdrawalTxnHash.filter(
//       (txn) => !allExistingTxns.includes(txn)
//     );

//     const processWithdrawalTxns = async () => {
//       for (const depositsTxn of unprocessedDeposits) {
//         const { sender, value, transactionHash } =
//           newWithdrawalnTxnDetails.find(
//             (txn) => txn.transactionHash === depositsTxn
//           );

//         const withdrawalDetails = {
//           userWallet: sender,
//           amount: value,
//           txnHash: transactionHash,
//           tokenType: "IRO",
//         };

//         const response = await IN_handleSuccessfulWithdrawal(withdrawalDetails);

//         if (response === -1) {
//           console.log(
//             `[IN - Withdrawal Validator]: Transaction ${transactionHash} is completed.`
//           );
//         }
//       }
//     };

//     processWithdrawalTxns();
//   }

//   const allTxns = [...depositTxns, ...withdrawTxns];
//   const allBlocks = allTxns.map((txns) => txns.blockNumber);
//   lastInBlock = allBlocks.sort().pop() + 1 || defaultInBlock;

//   console.log(`[IN VALIDATOR - block: ${lastInBlock}]]`);
//   return;
// };

// const ZENY_Validator = async () => {
//   if (lastZenyBlock < 1) {
//     console.log("Invalid LAST_ZENY_BLOCK value");
//     return;
//   }
//   const provider = new ethers.providers.WebSocketProvider(
//     `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ZENY_API_KEY}`
//   );

//   const ZenyContract = new ethers.Contract(
//     process.env.ZENY_CONTRACT_ADDRESS,
//     ZENY_CONTRACT_ABI,
//     provider
//   );

//   const depositAddress = ZenyContract.filters.Transfer(
//     null,
//     process.env.ZENY_CONTRACT_BURN_ADDRESS
//   );

//   const withdrawAddress = ZenyContract.filters.Transfer(
//     "0x0000000000000000000000000000000000000000",
//     null
//   );

//   const depositTxns = await ZenyContract.queryFilter(
//     depositAddress,
//     lastZenyBlock,
//     MAX_BLOCK_NUMBER
//   );

//   const withdrawTxns = await ZenyContract.queryFilter(
//     withdrawAddress,
//     lastZenyBlock,
//     MAX_BLOCK_NUMBER
//   );

//   if (depositTxns.length <= 0 && withdrawTxns.length <= 0) return;

//   if (depositTxns.length > 0) {
//     const newDepositTxnHash = depositTxns?.map(
//       (deposits) => `${deposits.transactionHash.toLowerCase()}`
//     );

//     const newDepositTxnDetails = depositTxns.map((txn) => ({
//       block: txn.blockNumber,
//       transactionHash: txn.transactionHash,
//       sender: txn.args.from,
//       receiverAddress: txn.args.to,
//       value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
//     }));

//     const allExistingTxns = await getAllExistingTransactionsFromLogs(
//       newDepositTxnHash
//     );

//     const unprocessedDeposits = newDepositTxnHash.filter(
//       (txn) => !allExistingTxns?.includes(txn)
//     );

//     if (unprocessedDeposits.length <= 0) return;

//     const processTxns = async () => {
//       for (const depositsTxn of unprocessedDeposits) {
//         const { sender, value, transactionHash } = newDepositTxnDetails.find(
//           (txn) => txn.transactionHash === depositsTxn
//         );

//         const depositDetails = {
//           userWallet: sender,
//           amount: value,
//           txnHash: transactionHash,
//         };

//         const response = await ZENY_handleSuccessfulDeposit(depositDetails);

//         if (response === -1) {
//           console.log(
//             `[ZENY - Deposit Validator]: Transaction ${transactionHash} is completed.`
//           );
//         }
//       }
//     };

//     processTxns();
//   }

//   if (withdrawTxns.length > 0) {
//     const newWithdrawalTxnHash = withdrawTxns?.map(
//       (withdrawals) => `${withdrawals.transactionHash.toLowerCase()}`
//     );

//     const newWithdrawalnTxnDetails = withdrawTxns.map((txn) => ({
//       block: txn.blockNumber,
//       transactionHash: txn.transactionHash,
//       sender: txn.args.from,
//       receiverAddress: txn.args.to,
//       value: parseFloat(ethers.utils.formatUnits(txn.args.value, 18)),
//     }));

//     const allExistingTxns = await getAllExistingTransactionsFromLogs(
//       newWithdrawalTxnHash
//     );

//     const unprocessedDeposits = newWithdrawalTxnHash.filter(
//       (txn) => !allExistingTxns.includes(txn)
//     );

//     const processWithdrawlTxns = async () => {
//       for (const depositsTxn of unprocessedDeposits) {
//         const { sender, value, transactionHash } =
//           newWithdrawalnTxnDetails.find(
//             (txn) => txn.transactionHash === depositsTxn
//           );

//         const withdrawalDetails = {
//           userWallet: sender,
//           amount: value,
//           txnHash: transactionHash,
//           tokenType: "ZENY",
//         };

//         const response = await ZENY_handleSuccessfulWithdrawal(
//           withdrawalDetails
//         );

//         if (response === -1) {
//           console.log(
//             `[ZENY - Withdrawal Validator]: Transaction ${transactionHash} is completed.`
//           );
//         }
//       }
//     };

//     processWithdrawlTxns();
//   }

//   const allTxns = [...depositTxns, ...withdrawTxns];

//   const allBlocks = allTxns.map((txns) => txns.blockNumber);

//   lastZenyBlock = allBlocks.sort().pop() + 1 || defaultZenyBlock;

//   console.log(`[ZENY VALIDATOR - block: ${lastZenyBlock}]]`);
//   return;
// };

// module.exports = {
//   IN_TransactionListener,
//   ZENY_TransactionListener,
//   IN_Validator,
//   ZENY_Validator,
// };
