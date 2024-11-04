require('dotenv').config();
const fs = require("fs");
const axios = require('axios');
const unzipper = require('unzipper');
const xml2js = require('xml2js');

const { TOKEN } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const POLLING_INTERVAL = 1000; // 1 second

// Function to download and extract text from PowerPoint file
const downloadAndExtractPowerPointText = async (url, destination) => {
    try {
        console.log("downloading...")
        // Download the PowerPoint file
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(destination, response.data);
        console.log(`PowerPoint downloaded to ${destination}`);

        // Extract text content from the PowerPoint file
        fs.createReadStream(destination)
            .pipe(unzipper.Parse())
            .on('entry', async (entry) => {
                const fileName = entry.path;
                if (fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')) {
                    const xmlData = await entry.buffer();
                    xml2js.parseString(xmlData.toString(), (err, result) => {
                        if (err) {
                            console.error('Error parsing slide XML:', err);
                        } else {
                            const slideText = [];
                            const paragraphs = result['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp'];
                            paragraphs.forEach((paragraph) => {
                                if (paragraph['p:txBody']) {
                                    paragraph['p:txBody'][0]['a:p'].forEach((p) => {
                                        if (p['a:r']) {
                                            p['a:r'].forEach((r) => {
                                                slideText.push(r['a:t'][0]);
                                            });
                                        }
                                    });
                                }
                            });
                            console.log(`Slide content:\n${slideText.join('\n')}`);
                        }
                    });
                } else {
                    entry.autodrain();
                }
            })
            .on('error', (error) => {
                console.error('Error reading PowerPoint file:', error);
            });

    } catch (error) {
        console.error(`Error downloading or extracting PowerPoint file: ${error}`);
    }
};

downloadAndExtractPowerPointText('https://api.telegram.org/file/bot7580447212:AAFVIi9n7xQ8llNAOAeJ20n9Zn0p7riKfN0/documents/file_12.pptx','/miemieDera_bot/')