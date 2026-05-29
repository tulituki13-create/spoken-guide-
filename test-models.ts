import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.list();
  const models = [];
  for await (const m of response) {
    if (m.name.includes("gemini")) models.push(m.name.replace("models/", ""));
  }
  
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: "Hi" });
      console.log(m + " succeeded");
    } catch (e: any) {
      if (!e.message.includes("429")) {
          console.log(m + " failed: " + e.message.substring(0, 100));
      }
    }
  }
}
run();
