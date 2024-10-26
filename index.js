require("dotenv").config();
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000; // Replace with your port
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API= `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
const SERVER_URL = process.env.SERVER_URL
const URI = `/webhook/${TELEGRAM_BOT_TOKEN}`
const WEBHOOK_URL =SERVER_URL+URI
console.log(WEBHOOK_URL)

app.use(bodyParser.json())

const init = async ()=> {
    const res =await  axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
    console.log(res.data)
}

app.listen(PORT, async () => {
    console.log(`App is listening on port ${PORT}`);
    await init()
});
