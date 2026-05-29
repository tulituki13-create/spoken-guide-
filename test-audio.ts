import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Hello" },
            { inlineData: { mimeType: "audio/webm", data: "UklGRiQAAABXRUJNRv8A//8=" } } // fake very small data
          ]
        }
      ]
    });
    console.log("Success:", res.text.substring(0, 50));
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
run();
