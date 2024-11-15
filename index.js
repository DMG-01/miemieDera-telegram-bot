require('dotenv').config();
const fs = require("fs");
const axios = require('axios');
const PdfParse = require('pdf-parse');
const mammoth = require("mammoth")

const cohere = require('cohere-ai');
const user = require("./models/usersModel")
const pptxCount = require("./models/pptxCount")
const connectDB = require("./db/connect")



const { TOKEN } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const POLLING_INTERVAL = 1000; // 1 second


const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

 async function main(text) {
  const chatCompletion = await getGroqChatCompletion(text);
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
  return(chatCompletion.choices[0]?.message?.content || "")
}

 async function getGroqChatCompletion(textToExplain) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "explain in 700 words" + textToExplain,
      },
    ],
    model: "llama3-8b-8192",
  });
}  



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
                keyboard: [["Summarize a Text", "Generate Questions From the Text"], ["echo messages", "say what I say"]],
                resize_keyboard: true
            },
        });
    } catch (error) {
       // console.error('Error sending message:', error);
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
        //console.error('Error downloading file:', error);
    }
}

const downloadAndExtractPdfFile =  async(url,destination) =>{

    try {
        const response = await axios.get(url, {responseType:`arraybuffer`})
        fs.writeFileSync(destination,response.data)
        console.log(`pdf downloaded to ${destination}`)
        const pdfBuffer = fs.readFileSync(destination)
        const pdfData = await PdfParse(pdfBuffer)
        //console.log(`extracted pdf content :${pdfData.text}`)
        //fs.writeFileSync("newpdf",pdfData.text)
        const summarizedText = main(pdfData.text)
        return summarizedText

    }catch(error) {
       // console.log(`error downloading file ${error}`)
    }
}

const PPTX2Json = require('pptx2json');

const downloadAndExtractPowerPointFile = async (url, destination) => {
    try {
        // Download the PowerPoint file
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(destination, response.data);
        console.log(`PowerPoint downloaded to ${destination}`);
        
        // Extract text content from the PowerPoint file
        console.log("----------------------------DESTINATION IS A TYPE OF " + typeof(destination))
        const result =  await extractPowerPointText(destination);
        console.log("RESULT:" + result)
        
        if (result) {
           // console.log(`Extracted PowerPoint content: ${JSON.stringify(result)}`);
           console.log(`Extracted PowerPoint content: ${(result)}`);

            
        } else {
           // console.error("Failed to extract content from the PowerPoint file.");
        }
        
    } catch (error) {
        //console.error(`Error downloading or extracting PowerPoint file: ${error}`);
    }
};

async function extractPowerPointText(filePath) {
    const pptx2json = new PPTX2Json(filePath);

    try {
        const data = await pptx2json.toJson(filePath);

        
        const extractedText = data.slides.map((slide, index) => {
            return `Slide ${index + 1}:\n` + slide.content.map(content => content.text).join('\n');
        }).join('\n\n');
        
        return extractedText;

    } catch (error) {
       // console.error('Error parsing PowerPoint file:', error);
        return null; // Return null on failure
    }
}  
// Replace with the path to your .pptx file





let fileDownloadLink,destinationPath,filePath
// Main function to start long pollingconst startPolling = async () => {
    const startPolling = async () => {
        await connectDB(process.env.MONGO_URI);
        let offset = 0; // Initialize offset for updates
    
        while (true) {
            const updates = await getUpdates(offset);
            if (updates.length > 0) {
                for (const update of updates) { // Use for...of for async handling
                    if (update.message) {
                        const chatId = update.message.chat.id;
                        const userId = update.message.from.id;
                        const firstName = update.message.from.first_name;
                        const lastName = update.message.from.last_name;
                        const userName = update.message.from.username;
                        const text = update.message.text
    
                        try {
                            // Check if user exists, if not, create a new user
                            const existingUser = await user.findOne({ userId: userId });
                            if (!existingUser) {
                                await user.create({
                                    userId: userId,
                                    firstName: firstName,
                                    lastName: lastName,
                                    userName: userName
                                });
                            }
                        } catch (error) {
                            console.error("Error creating or finding user:", error);
                            continue; // Move to the next update in case of user creation error
                        }

                        if (/[a-zA-Z]/.test(text)) {
                            if (/miemieDera/i.test(text)) {  // 'i' makes the regex case-insensitive
                                sendMessage(chatId, `Hello ${firstName}, this is miemieDera, your universal bot. I can help with summarizing any text document and more...😁`);
                            }
                        }

                        
                        console.log(fileDownloadLink)
                        console.log(destinationPath)
                        console.log(filePath)
                        

                        if(text == "Summarize a Text") {
                            sendMessage(chatId, "Please wait while we process your document 😇💡");
                            console.log("---------------------------------------------------------------------")
                            console.log(`file download link : ${fileDownloadLink}`)
                            console.log(`file destination path : ${destinationPath}`)
                            let processedText  = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath);
                            sendMessage(chatId,processedText)
                        }
                        
                        
    
                        // File processing logic
                        else if (update.message.document) {
                            const fileId = update.message.document.file_id;
    
                            try {
                                // Retrieve file path from Telegram
                                const fileResponse = await axios.get(`${TELEGRAM_API}/getFile`, {
                                    params: { file_id: fileId }
                                });
    
                                 filePath = fileResponse.data.result.file_path;
                                 fileDownloadLink = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
                                 destinationPath = `C:\\Users\\HP\\miemieDera_bot\\downloadedDocuments\\${update.message.document.file_name}`;
    
                                console.log("Attempting to download from:", fileDownloadLink);
    
                                if (filePath.endsWith(".txt")) {
                                    await downloadFile(fileDownloadLink, destinationPath);
                                    console.log("File ID:", fileId);
                                    console.log("File Path:", filePath);
                                } else if (filePath.endsWith(".pdf")) {
                                    sendMessage(chatId,"How would you like your document to be processed? summarize, generate 30 questions or summarize and generate 30 questions please use the customized keyboard near the voice note icon")
                                   
                                    
                                    //const text = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath);
                                    //sendMessage(chatId, text);
                                    console.log("File ID:", fileId);
                                    console.log("File Path:", filePath);
                                    console.log(`PDF FILE DOWNLOAD LINK: ${fileDownloadLink}`)
                                    console.log(`PDF FILE DESTINATION PATH: ${destinationPath}`)
                                } else if (filePath.endsWith(".pptx")) {
                                    sendMessage(chatId, "Sorry, we cannot process PowerPoint files yet. If you have a PDF or .docx version, we can process it 😊😇");
                                    let count = await pptxCount.findOne({id:1});
                                    if(!count) {
                                        count = await pptxCount.create({numberOfCount:0,id:1}) 
                                    }
                                     count.numberOfCount++
                                     console.log(`TOTAL NUMBER OF POWER POINT REQUEST : ${count.numberOfCount}`)
                                     await count.save()
                                    console.log("PowerPoint file received");
                                    console.log("File ID:", fileId);
                                    console.log("File Path:", filePath);
                                }
                            } catch (error) {
                                if (error.message.includes("context_length_exceeded")) {
                                    sendMessage(chatId, "Exceeded the file limit. You should read it yourself! 😭😖");
                                } else {
                                    //console.error(`Failed to process file: ${error.message}`);
                                }
                            }
                        } else {
                            console.log("No document found in this message.");
                        }
                    }
                }
    
                // Update offset to avoid re-fetching the same updates
                offset = updates[updates.length - 1].update_id + 1;
            }
    
            // Wait before checking for updates again
            await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
        }
    };
    
    // Start the bot
    startPolling();
    