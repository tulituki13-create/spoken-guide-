import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const mimes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/aac", "audio/mp3"];
  for (const m of mimes) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: [
          {
            role: "user",
            parts: [
              { text: "Hello" },
              { inlineData: { mimeType: m, data: "UklGRiQAAABXRUJNRv8A//8=" } } 
            ]
          }
        ]
      });
      console.log("Success:", m);
    } catch (e: any) {
      console.log("Error:", m, e.message);
    }
  }
}
run();
