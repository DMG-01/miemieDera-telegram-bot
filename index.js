require('dotenv').config();
const fs = require("fs");
const axios = require('axios');
const PdfParse = require('pdf-parse');
const mammoth = require("mammoth")
const {cohere} = require("cohere-ai")

const { TOKEN } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const POLLING_INTERVAL = 1000; // 1 second


cohere.init(process.env.COHERE_API_KEY);

// Function to get updates
const getUpdates = async (offset) => {
    try {
        const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
            params: { offset, timeout: 10, limit: 100 },
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
                keyboard: [["send a poll", "pin a chat"], ["echo messages", "say what I say"]],
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
const downloadFile = async (url, destination, mimeType) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(destination, response.data);

        console.log(`File downloaded to: ${destination}`);

        // Only try reading content if the file is a text file
        if (mimeType && mimeType.startsWith('text')) {
            const content = fs.readFileSync(destination, 'utf8');
            console.log('File Content:', content);
        } else {
            console.log('Downloaded file is not a text file or is binary.');
        }
    } catch (error) {
        console.error('Error downloading file:', error);
    }
}

const downloadAndExtractPdfFile =  async(url,destination) =>{

    try {
        const response = await axios.get(url, {responseType:`arraybuffer`})
        fs.writeFileSync(destination,response.data)
        console.log(`pdf downloaded to ${destination}`)
        const pdfBuffer = fs.readFileSync(destination)
        const pdfData = await PdfParse(pdfBuffer)
        console.log(`extracted pdf content :${pdfData.text}`)
        fs.writeFileSync("newpdf",pdfData.text)

    }catch(error) {
        console.log(`error downloading file ${error}`)
    }
}


const downloadAndExtractPowerPointFile = async (url,destination) => {

    try {
        const response = await axios.get(url,{responseType:`arrayBuffer`})
        fs.readFileSync(destination.response.data)
        console.log(`pdf downloaded at ${destination}`)
        const powerPointBuffer = fs.readFileSync(destination)
        const result = await mammoth.extractRawText({powerPointBuffer})
        console.log(result)
        console.log(result.data)
        console.log(explainText(result.data));



    }catch(error) {
        console.log(`error occured while downloading and extracting powerpoint file ${error}`)
    }
}

async function explainText(input) {
    const response = await cohere.generate({
        model: 'command',
        prompt: `Explain this text in simpler terms: ${input}`,
        max_tokens: 50,
    });
    console.log("Explanation:", response.body.generations[0].text);
}





// Main function to start long polling
const startPolling = async () => {
    let offset = 0; // Initialize offset for updates

    while (true) {
        const updates = await getUpdates(offset);
        if (updates.length > 0) {
            updates.forEach(async (update) => {
                if (update.message && update.message.document) {
                    const fileId = update.message.document.file_id;

                    try {
                        // Retrieve file path from Telegram
                        const fileResponse = await axios.get(`${TELEGRAM_API}/getFile`, {
                            params: { file_id: fileId }
                        });

                        const filePath = fileResponse.data.result.file_path;
                        const fileDownloadLink = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;

                        const destinationPath = `C:\\Users\\HP\\miemieDera_bot\\downloadedDocuments\\${update.message.document.file_name}`;

                        console.log("Attempting to download from:", fileDownloadLink);
                        if(filePath.endsWith(".txt")) {
                        await downloadFile(fileDownloadLink, destinationPath);

                        console.log("File ID:", fileId);
                        console.log("File Path:", filePath);
                        }
                        
                        else if(filePath.endsWith(".pdf")) {
                            await downloadAndExtractPdfFile(fileDownloadLink,destinationPath)
                             console.log("File ID:", fileId);
                            console.log("File Path:", filePath);
                        } 
                        else if (filePath.endsWith(".pptx")) {
                            await downloadAndExtractPowerPointFile(fileDownloadLink,destinationPath)
                            console.log("File ID:", fileId);
                            console.log("File Path:", filePath);

                        }
                    } catch (error) {
                        console.error(`Failed to download file: ${error.message}`);
                    }
                } else {
                    console.log("No document found in this update.");
                }
            });

            // Update offset to avoid re-fetching the same updates
            offset = updates[updates.length - 1].update_id + 1;
        }

        // Wait before checking for updates again
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
};

// Start the bot
startPolling();
