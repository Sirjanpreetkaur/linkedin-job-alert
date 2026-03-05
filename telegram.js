const axios = require("axios");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message) {

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: message,
  });

}

module.exports = { sendTelegramMessage };