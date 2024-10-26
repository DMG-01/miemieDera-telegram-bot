require('dotenv').config();
const axios = require('axios');

const { TOKEN } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const POLLING_INTERVAL = 1000; // 1 second

// Function to get updates
const getUpdates = async (offset) => {
    try {
        const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
            params: {
                offset,
                timeout: 10, // Wait for updates for 10 seconds
                limit: 100,
            },
        });
        return response.data.result;
    } catch (error) {
        console.error('Error fetching updates:', error);
        return [];
    }
};

// Function to send messages
const sendMessage = async (chatId, text) => {
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: text,
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Main function to start long polling
const startPolling = async () => {
    let offset = 0; // Initialize offset for updates

    while (true) {
        const updates = await getUpdates(offset);
        if (updates.length > 0) {
            updates.forEach((update) => {
                const chatId = update.message.chat.id;
                const text = update.message.text;

                // Echo the received message back
                sendMessage(chatId, text);

                // Update offset for the next request
                offset = update.update_id + 1;
            });
        }

        // Wait for a specified interval before checking for updates again
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
};

// Start the bot
startPolling();
