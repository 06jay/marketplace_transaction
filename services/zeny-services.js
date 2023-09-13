const axios = require("axios");

const url = `http://localhost:${
  process.env.MARKETPLACE_PORT || 5001
}/api/tokens`;

axios.defaults.headers.common["Authorization"] = process.env.MARKETPLACE_SECRET;

module.exports.processZenyDeposit = async (userWallet, data) => {
  try {
    const res = axios.post(`${url}/deposit/zeny/${userWallet}`, data);

    return res;
  } catch (error) {
    console.log({ error: "zeny-HELLO WORLD" });
  }
};

module.exports.processZenyWithdrawal = async (userWallet, data) => {
  try {
    const res = axios.post(`${url}/withdraw/zeny/${userWallet}`, data);

    return res;
  } catch (error) {
    console.log({ error: "zeny-HELLO WORLD" });
  }
};
