const axios = require("axios");

const url = `http://localhost:${
  process.env.MARKETPLACE_PORT || 5001
}/api/offerings`;

axios.defaults.headers.common["Authorization"] = process.env.MARKETPLACE_SECRET;

module.exports.processUsdtPayment = async (itemId, data) => {
  try {
    const res = axios.post(`${url}/${itemId}`, data);

    return res;
  } catch (error) {
    console.log({ error });
  }
};
