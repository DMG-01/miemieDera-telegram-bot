require('dotenv').config();
const fs = require("fs");
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
            reply_markup: {
                keyboard: [
                    ["send a poll", "pin a chat"],
                    ["echo messages", "say what I say"]
                ],
                resize_keyboard: true
            },
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Function to create a poll
const createPoll = async (chatId, question, options) => {
    try {
        await axios.post(`${TELEGRAM_API}/sendPoll`, {
            chat_id: chatId,
            question: question,
            options: options
        });
    } catch (error) {
        console.error('Error creating poll:', error);
    }
};

// Function to download a file
const downloadFile = async (url, destination) => {
    try {
        //await axios.get(`${TELEGRAM_API}/getFile`)
        const response = await axios.get(`${TELEGRAM_API}/getFile`, { responseType: 'arraybuffer' });
        fs.writeFileSync(destination, response.data);

        const content = fs.readFileSync(destination, 'utf8');
        console.log(content);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

// Main function to start long polling
let logged = false
const startPolling = async () => {
    let offset = 0; // Initialize offset for updates

    while (true) {
        const updates = await getUpdates(offset);
        if (updates.length > 0) {
            updates.forEach(async (update) => {
                /*if (update.message && update.message.chat) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text;

                    // Echo the received message back
                    if (text) {
                        await sendMessage(chatId, text);
                    }

                    // Create a poll when receiving a message
                    await createPoll(chatId, "Your age?", [
                        { text: "15" },
                        { text: "18" },
                        { text: "23" }
                    ]);

                    // Update offset for the next request
                    offset = update.update_id + 1;
                    console.log("Offset is: " + offset);
                    console.log("Chat ID: " + chatId);
                } else*/ if (update.message && update.message.document) {
                    const fileId = update.message.document.file_id;

                    const fileobj = await axios.get(`${TELEGRAM_API}/getFile`,{
                        params:{
                            file_id : fileId
                        }

                        
                    })

                    
                    if(!logged) {
                        console.log("File ID: " + fileId);
                        console.log(fileobj)
                        logged = true
                    }
                  
                   // downloadFile("https://api.telegram.org/file/bot<token>/<file_path>")

                    // Download the file (you'll need to implement the logic to get the file URL)
                    // const fileUrl = `${TELEGRAM_API}/file/bot${TOKEN}/${fileId}`; // Example URL
                    // await downloadFile(fileUrl, 'your_destination_path');
                } else {
                    console.log("No documents found");
                }
            });
        }

        // Wait for a specified interval before checking for updates again
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
};

// Start the bot
startPolling();
