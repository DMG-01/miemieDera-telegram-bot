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

 async function main(text,fn) {
    if(fn == "S") {
  const chatCompletion = await getGroqChatCompletion(text);
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
  return(chatCompletion.choices[0]?.message?.content || "")
    }else if(fn == "G") {

    const chatCompletion = await getGroqChatCompletionII(text);
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
  return(chatCompletion.choices[0]?.message?.content || "")
    }
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


async function getGroqChatCompletionII(textToGenerateFrom) {
    return groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:`Generate 15 multiple-choice questions from the following text in this specific format:

Question 1

Question text: <Insert question text here>
Options:

Option A: <Insert option A text>
Option B: <Insert option B text>
Option C: <Insert option C text>
Option D: <Insert option D text>
Answer:

Answer: <Correct option letter without asterisks>
Continue this pattern for each question, up to 15 questions. Avoid adding any extra formatting outside of this pattern."` + textToGenerateFrom,
        },
      ],
      model: "llama3-8b-8192",
    });
  }  


  function processQuestions(text = "") { 
    if (!text) {
        console.log("Warning: No text provided to process questions.");
        return []; // Return an empty array to avoid further processing if text is empty
    }

    // Splitting based on "Question x" pattern, where x is the question number
    const questionsArray = text.split(/Question \d+\n/).slice(1);

    // Debug: Log each question's raw text after splitting
    console.log("Questions array after split:", questionsArray);

    const parsedQuestions = questionsArray.map((q, index) => {
        const [questionAndOptions, answer] = q.split("Answer:").map(part => part.trim());

        // Check if question and answer parts exist
        if (!questionAndOptions || !answer) {
            console.log(`Warning: Missing question, options, or answer in question ${index + 1}`);
            console.log("Raw text for this question:", q); // Log raw question text for troubleshooting
            return null; // Skip this question if format is unexpected
        }

        // Separate question text and options
        const lines = questionAndOptions.split("\n").filter(line => line.trim());

        const questionText = lines[0].replace("Question text:", "").trim(); // First line should be the question text

        // Options start from the second line onward, formatted with "Option A:" etc.
        const options = lines.slice(1).map(option => {
            return option.replace(/^Option [A-D]:\s*/, '').trim();
        });

        return {
            question: `Question ${index + 1}: ${questionText}`,
            options: options,
            answer: `Answer: ${answer}`
        };
    });

    

    // Filter out any null entries from unexpected format cases
    const validParsedQuestions = parsedQuestions.filter(q => q !== null);

    // Debug: Final parsed questions
    console.log("Parsed questions:", validParsedQuestions);
    return validParsedQuestions;
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
const createPoll = async (chatId, question, options,correctOption) => {
    try {
        await axios.post(`${TELEGRAM_API}/sendPoll`, {
            chat_id: chatId,
            question: question,
            options: options,
            type: "quiz",
            allows_multiple_answers:false,
            correct_option_id:correctOption
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

const downloadAndExtractPdfFile =  async(url,destination,fn) =>{

    try {
        const response = await axios.get(url, {responseType:`arraybuffer`})
        fs.writeFileSync(destination,response.data)
        console.log(`pdf downloaded to ${destination}`)
        const pdfBuffer = fs.readFileSync(destination)
        const pdfData = await PdfParse(pdfBuffer)
        //console.log(`extracted pdf content :${pdfData.text}`)
        //fs.writeFileSync("newpdf",pdfData.text)
        if(fn == "S") {
        const summarizedText = main(pdfData.text,fn)
        return summarizedText
        }else if(fn == "G") {
            const generatedText = main(pdfData.text,fn)
            return generatedText
        }

    }catch(error) {
       // console.log(`error downloading file ${error}`)
    }
}

const PPTX2Json = require('pptx2json');
const { ChatStreamEndEventFinishReason } = require('cohere-ai/api');

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



const userState = {}

//let fileDownloadLink,destinationPath,filePath
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

                        
                       // console.log(fileDownloadLink)
                        //console.log(destinationPath)
                        //console.log(filePath)
                        

                        if(text == "Summarize a Text") {
                            sendMessage(chatId, "Please send the document you would want us to process 😇💡");
                            console.log("---------------------------------------------------------------------")
                            /* console.log(`file download link : ${fileDownloadLink}`)
                             console.log(`file destination path : ${destinationPath}`)
                            let processedText  = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath,"S");
                             */
                            userState[chatId] = "summarize"
                            console.log("user state is " + userState[chatId])
                            //sendMessage(chatId,processedText)
                        }
                        else if(text == "Generate Questions From the Text") {
                            sendMessage(chatId, "Please send document you would want us to generate questions from 😇💡");
                            userState[chatId] = "generate"

                            console.log("user state is " + userState[chatId])
                        }
                        
                        
                        
    
                        // File processing logic
                        else if (update.message.document) {
                            const fileId = update.message.document.file_id;
    
                            try {
                                // Retrieve file path from Telegram
                                const fileResponse = await axios.get(`${TELEGRAM_API}/getFile`, {
                                    params: { file_id: fileId }
                                });
                                
                                let fileDownloadLink, destinationPath,filePath

                                 filePath = fileResponse.data.result.file_path;
                                 fileDownloadLink = `https://api.telegram.org/file/bot${TOKEN}/${filePath}`;
                                 destinationPath = `C:\\Users\\HP\\miemieDera_bot\\downloadedDocuments\\${update.message.document.file_name}`;
    
                                console.log("Attempting to download from:", fileDownloadLink);
                                
                                if (filePath.endsWith(".txt")) {

                                    try {
                                        await downloadFile(fileDownloadLink, destinationPath);
                                        console.log("done downloading")
                                        }catch (error) {
                                            if (error.message.includes("context_length_exceeded")) {
                                                sendMessage(chatId, "Exceeded the file limit. You should read it yourself! 😭😖");
                                            } else {
                                                //console.error(`Failed to process file: ${error.message}`);
                                            }
                                        }

                                    if(userState[chatId] == "summarize") {
                                        sendMessage(chatId,"please wait while we process your document")
                                        let processedText  = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath,"S");
                                        sendMessage(chatId,processedText)
                                        userState[chatId] == "idle"
                                        console.log(`after file processing the user state is ${userState[chatId]}`)
                                    }


                                    else if (userState[chatId] = "generate")  {
                                        sendMessage(chatId,"please wait while we process your document")
                                        
                                        if((fileDownloadLink == undefined) || (destinationPath == undefined)) {
                                            sendMessage(chatId,"Please send the document you want us to process");
                                        }
                                        let processedText = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath,"G");
                                        let questionsArray = processQuestions(processedText);
                                        
                                        if(questionsArray.length < 10) {
                                            sendMessage(chatId,"Seems you have problem with your internet connection, generate questions again")
                                        } 
                                        else {
                                    
                                        // Loop through each question and create a poll
                                        for (let i = 0; i < questionsArray.length; i++) {
                                            const questionObj = questionsArray[i];
                                            const { question, options, answer } = questionObj;
                                            console.log("answer to question is::::" + answer)
                                            mainAns = answer[answer.length-1]
                                            
                                            if(mainAns == "A"){
                                                correctOptionIndex = 1
                                            }else if(mainAns == "B") {
                                                correctOptionIndex = 2
                                            }else if(mainAns == "C") {
                                                correctOptionIndex = 3
                                            }else if(mainAns =="D") {
                                                correctOptionIndex = 4
                                            }
                                            // Find the index of the correct answer option in options array
                                            //const correctOptionIndex = options.findIndex(option => option === answer.replace("Answer: ", ""));
                                    
                                            // Call createPoll for each question
                                            await createPoll(chatId, question, options, correctOptionIndex);
                                            
                                            // Optional delay to prevent spamming in case of large question lists
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                        }
                                        userState[chatId] = "idle"
                                    }
                                    console.log("File ID:", fileId);
                                    console.log("File Path:", filePath);
                                }   
                                }
                                
                            else if (filePath.endsWith(".pdf")) {
                                   

                                    try {
                                        await downloadAndExtractPdfFile(fileDownloadLink, destinationPath);
                                        console.log("done downloading")
                                        }catch (error) {
                                            if (error.message.includes("context_length_exceeded")) {
                                                sendMessage(chatId, "Exceeded the file limit. You should read it yourself! 😭😖");
                                            } else {
                                                //console.error(`Failed to process file: ${error.message}`);
                                            }
                                        }
                                    
                                    if(userState[chatId] == "summarize") {
                                        console.log("user state is--- " + userState[chatId])
                                        sendMessage(chatId,"please wait while we process your document")
                                        let processedText  = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath,"S");
                                        sendMessage(chatId,processedText)
                                        userState[chatId] = "idle"
                                        console.log(`user state after processing file is ${userState[chatId]}`)
                                    }
                                    else if (userState[chatId] == "generate")  {
                                        sendMessage(chatId,"please wait while we process your document")
                                        console.log("user state is ---------------" + userState[chatId])
                                        
                                        if((fileDownloadLink == undefined) || (destinationPath == undefined)) {
                                            sendMessage(chatId,"Please send the document you want us to process");
                                        }
                                        let processedText = await downloadAndExtractPdfFile(fileDownloadLink, destinationPath,"G");
                                        let questionsArray = processQuestions(processedText);
                                        
                                        if(questionsArray.length < 10) {
                                         questionsArray = processQuestions(processedText);
                                        } else {
                                    
                                        // Loop through each question and create a poll
                                        for (let i = 0; i < questionsArray.length; i++) {
                                            const questionObj = questionsArray[i];
                                            const { question, options, answer } = questionObj;
                                            console.log("answer to question is::::" + answer)
                                            mainAns = answer[answer.length-1]
                                            let correctOptionIndex
                                            
                                            if(mainAns == "A"){
                                                correctOptionIndex = 1
                                            }else if(mainAns == "B") {
                                                correctOptionIndex = 2
                                            }else if(mainAns == "C") {
                                                correctOptionIndex = 3
                                            }else if(mainAns =="D") {
                                                correctOptionIndex = 4
                                            }
                                            // Find the index of the correct answer option in options array
                                            //const correctOptionIndex = options.findIndex(option => option === answer.replace("Answer: ", ""));
                                    
                                            // Call createPoll for each question
                                            await createPoll(chatId, question, options, correctOptionIndex);
                                            
                                            // Optional delay to prevent spamming in case of large question lists
                                            await new Promise(resolve => setTimeout(resolve, 1000));
                                        }
                                        userState[chatId] = "idle"
                                        console.log(`userState after file processing is ${userState[ChatStreamEndEventFinishReason]}`)
                                    }
                                    console.log("File ID:", fileId);
                                    console.log("File Path:", filePath);
                                    console.log(`after file processing the user state is ${userState[chatId]}`)
                                } else {
                                    console.log("nothing to do?")
                                }

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
                            } catch(error) {
                                console.log("error: " + error )
                            }
                        }
                         /*else {
                            console.log("No document found in this message.");
                        }*/
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
    