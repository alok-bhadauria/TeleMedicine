const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // For getting just the model list, usually we access the API directly or use the model's list method if available in SDK
        // The Node SDK 0.24.x might not expose listModels directly on the main class easily without checking docs, 
        // but typically it's specific.

        // Actually, let's try a standard generation with a very safe legacy model if possible, 
        // BUT listing is better. 
        // NOTE: The current SDK documentation suggests using a specific client or just trying known models.
        // Let's rely on standard debugging: try 'gemini-1.5-flash-8b', 'gemini-1.5-flash-001', 'gemini-pro'.

        // However, since I can run code, let's try to verify if the key works at all.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Adding API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

        // We will try to generate content. If it fails, we catch it.
        // There isn't a simple "listModels" in the high-level GoogleGenerativeAI class in earlier versions, 
        // but let's try to use the model we have and see if we can get a clearer error or if 'gemini-1.5-flash-latest' works.

        // Actually, let's try 'gemini-1.0-pro' which is the stable version of 'gemini-pro'.
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.0-pro", "gemini-pro"];

        for (const mName of modelsToTry) {
            console.log(`Testing model: ${mName}`);
            try {
                const m = genAI.getGenerativeModel({ model: mName });
                const result = await m.generateContent("Test");
                const response = await result.response;
                console.log(`SUCCESS: ${mName} works!`);
                console.log(response.text());
                break;
            } catch (error) {
                console.log(`FAILED: ${mName} - ${error.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

listModels();
