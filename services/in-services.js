const axios = require("axios");

const url = `http://localhost:${
  process.env.MARKETPLACE_PORT || 5001
}/api/tokens`;

axios.defaults.headers.common["Authorization"] = process.env.MARKETPLACE_SECRET;

module.exports.processInDeposit = async (userWallet, data) => {
  try {
    const res = axios.post(`${url}/deposit/iro/${userWallet}`, data);

    return res;
  } catch (error) {
    console.log({ error: "in-HELLO WORLD" });
  }
};

module.exports.processInWithdrawal = async (userWallet, data) => {
  try {
    const res = axios.post(`${url}/withdraw/iro/${userWallet}`, data);

    return res;
  } catch (error) {
    console.log({ error: "in-HELLO WORLD" });
  }
};
