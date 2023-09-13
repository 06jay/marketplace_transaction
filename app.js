const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cron = require("node-cron");
const { InTransactionListner } = require("./utils/listeners/in-listener");
const { ZenyTransactionListener } = require("./utils/listeners/zeny-listener");
const { InValidator } = require("./utils/validators/in-validator");
const { ZenyValidator } = require("./utils/validators/zeny-validator");
const { UsdtValidator } = require("./utils/validators/usdt-validator");
const { UsdtTransactionListener } = require("./utils/listeners/usdt-listener");

const VALIDATOR_CRON_JOB_SCHEDULE = "*/5 * * * *"; // every 5 minutes
const SERVER_CRON_JOB_SCHEDULE = "0 */12 * * *"; // every 12 hours

const isUsdtPaymentListnersEnabled =
  process.env.ENABLE_USDT_LISTENER === "true" ||
  process.env.ENABLE_USDT_LISTENER === true;

const main = () => {
  try {
    console.log(`[${new Date()}]: Starting Listeners...`);
    InTransactionListner();
    ZenyTransactionListener();

    isUsdtPaymentListnersEnabled && UsdtTransactionListener();

    InValidator();
    ZenyValidator();
    isUsdtPaymentListnersEnabled && UsdtValidator();

    // Cron -  validators
    cron.schedule(VALIDATOR_CRON_JOB_SCHEDULE, () => {
      InValidator();
      ZenyValidator();
      isUsdtPaymentListnersEnabled && UsdtValidator();
    });

    // Cron -  restart blockchain listeners
    cron.schedule(SERVER_CRON_JOB_SCHEDULE, () => {
      process.exit(0);
    });
  } catch (error) {
    console.log({ error });
  }
};

main();
