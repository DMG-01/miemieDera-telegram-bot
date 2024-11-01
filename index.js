require('dotenv').config();
const fs = require("fs");
const axios = require('axios');
const PdfParse = require('pdf-parse');
const mammoth = require("mammoth")
//const {cohere} = require("cohere-ai")
const cohere = require('cohere-ai');
//cohere.init(process.env.COHERE_API_KEY);


const { TOKEN } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const POLLING_INTERVAL = 1000; // 1 second


const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

 async function main(text) {
  const chatCompletion = await getGroqChatCompletion(text);
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

 async function getGroqChatCompletion(textToExplain) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "explain " + textToExplain,
      },
    ],
    model: "llama3-8b-8192",
  });
}  
newText = `PURPOSE, PLAN & PURSUIT
Presented
by
Prof. David O. Olukanni
david.olukanni@covenantuniversity.edu.ng
• To explore and reveal the treasures embedded in you
• To reveal that everyone was created by God to fulfill a divine agenda with
his/her divine ability
• To help students understand that there is no automatic profiting in life but that
every man’s profit is packaged in his/her potentials
• To help students understand that they can think things through and make it
happen
• To establish the fact that your thought is the key to your life
• To stir up the hidden abilities and release the enabling potentials inside of you
Objectives of this class
• There is no Accidental Birth or Creation Jer. 1:5; Gal. 1:15
• The Lord made only one version of you and customized you for a
particular assignment. Think of our thumb capturing machine....
• You are born to maximize life’s potential, Personally, Professionally and
Spiritually
• God has deposited in you the required tools to do your divine assignment
• What you have done already in life is just a small fraction of what you are
meant to accomplish in life
Biblical Truths With Respect To God’s Purpose For Man
Take a moment and answer these important questions
pertaining to you:
i. Who am I?
ii.Where am I?
iii.Where am I going?
•  What are you called to do as a Christians?
•  What are the tools deposited in me for performing
my assignment?
•  Who are the recipient of my assignment?
The Big Questions?
• We are like unplugged appliances and God is the
power outlet.
•  Until we plug into Him, we are powerless, but when we
depend on Him we have the power of the eternal God
working within us (1 Peter 1:3; Ephesians 3:20).
•  Remember we are a tool/Vessels in God’s hands
•  We must allow Him to use us for the right purpose

2/8/2021
2
Basic Spiritual Foundations and How they are boosters for spiritual
development
i. Prayer
(Jer. 33.3)
ii. Study of the Word
(Joshua 1:8; 2 Tim 2:15)
iii. Prayer and Fasting
(Isaiah 58:9)
iv. Reading Spiritual Books
(Prov. 25:2)
v. Meditation
(Joshua 1:8)
vi. Understanding Divine Direction
(Prov. 25:2)
vii.God’s Purpose for our lives
(Jer. 29:11)
2/8/2021
7
Some Quotes
“The greatest discovery of all in life
is the discovery of self” –Dr. David
Oyedepo
Divine plan is
useless without
divine insights.”
2/8/2021
8
“The greatest discovery in life is self-
discovery. Until you find yourself you
will always be someone else.
Become yourself.” Myles Munroe
“The secret to a full and
fulfilled life is discovery,
Understanding, and
Application of Kingdom of
Heave on Earth”
2/8/2021
9
“I was once afraid of people saying;
Who does she think she is? Now I
have the courage to stand and say,
“This is who I am.” Oprah Winfrey
“The biggest adventure you can
ever take is to live the life of your
dreams” Oprah Winfrey
2/8/2021
10
“Be sincere with yourself and Identify
the Gifts and Talents within you”
David Olukanni
“You can identify and nurture that
which is in you than anyone else”
David Olukanni
2/8/2021
11
2/8/2021
12
“It is better to be prepared and not have an opportunity than to have an
opportunity and not be prepared”Les Brown
Don’t let someone else opinion of you become your reality   Les Brown
You must remain focus on your
journey to greatness

2/8/2021
3
2/8/2021
13
Finally, You must understand the following:
You must recognize the place of God in your life
You must believe in yourself
You must be watchful
You must Seek for it if you truly desire to discover
yourself
Recommended Texts
The Holy Bible
The Force of Freedom (Dr. David Oyedepo)
Understanding Divine Direction  (Dr. David Oyedepo)
Understanding your Potential  (Dr. Myles Munroe)
Ruling your World authored  (Dr. David Oyedepo)
No Excuses: The Power of Self-Discipline (Brian Tracy)
2/8/2021
14
Remember This Song:
You are Yahweh Eh Eh Eh; You are
Yahweh, Alpha and Omega
Thank you!
Enjoy the rest of the session
It is Time to Discover........
The Real You!
“For the creation waits in eager expectation for
the children of God to be revealed”.
Romans 8:19 NIV
2/8/2021`
//main(newText)


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
        //fs.writeFileSync("newpdf",pdfData.text)
        main(pdfData.text)

    }catch(error) {
        console.log(`error downloading file ${error}`)
    }
}


const downloadAndExtractPowerPointFile = async (url, destination) => {
    try {
        const response = await axios.get(url, { responseType: `arraybuffer` });
        fs.writeFileSync(destination, response.data);
        console.log(`PowerPoint downloaded to ${destination}`);
        
        const result = await mammoth.extractRawText({ path: destination });
        
        console.log(`Extracted PowerPoint content: ${result.value}`);

        
        // Send extracted text content to Groq API
        // main(result.value);
        //console.log(main(result.value))
        
    } catch (error) {
        console.error(`Error downloading or extracting PowerPoint file: ${error}`);
    }
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
                            console.log("power point file")
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
