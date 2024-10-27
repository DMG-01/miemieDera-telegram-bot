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
          reply_markup: reply_markup = {
                
               keyboard: [ 
                ["send a poll", "pin a chat"],
                ["echo messages","say what i say"]
            ],
            resize_keyboard:true 
          },
          

        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

const createPoll = async(chatId,question,options)=> {

    try {
        await axios.post(`${TELEGRAM_API}/sendPoll`, {
            chat_id:chatId,
            question:question,
            options:options
        })
    }catch(error) {
        console.log(error)
    }
}



// Main function to start long polling
const startPolling = async () => {
    let offset = 0; // Initialize offset for updates

    while (true) {
        const updates = await getUpdates(offset);
        if (updates.length > 0) {
            updates.forEach((update) => {
                if (update.message && update.message.chat) {
                const chatId = update.message.chat.id;
                const text = update.message.text;

                // Echo the received message back
                sendMessage(chatId, text);

                createPoll(chatId,"your age",[
                    {
                        text:"15"
                    },{
                        text:"18"
                    },
                    {
                        text:"23"
                    }
                ])

                // Update offset for the next request
                offset = update.update_id + 1;
                console.log("offset is : "+ offset)
                console.log("chat id : "+ chatId)
                }/*
                else if(update.message.chat){
                    const chatId = update.message.chat.id

                    createPoll(chatId,"your age",[
                        {
                            text:"15"
                        },{
                            text:"18"
                        },
                        {
                            text:"23"
                        }
                    ])
                }*/
            });
        }

        // Wait for a specified interval before checking for updates again
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
};

// Start the bot
startPolling();
