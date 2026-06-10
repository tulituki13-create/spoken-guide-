import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import { GRAMMAR_TOPICS } from "./src/lib/grammarTopics.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function callModel(promptText: string) {
    let retries = 3;
    while(retries > 0) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
            return JSON.parse(response.text || "[]");
        } catch(e) {
            retries--;
             await new Promise(r => setTimeout(r, 2000));
        }
    }
    return [];
}

async function main() {
  const topicsToProcess = GRAMMAR_TOPICS.filter(t => t.section === "Spoken Practice" || t.section === "Learner Focus");
  
  let subtopicsMap: Record<string, string[]> = {};
  if (fs.existsSync("./src/lib/subtopics.ts")) {
      const content = fs.readFileSync("./src/lib/subtopics.ts", "utf-8");
      const jsonStr = content.substring(content.indexOf("=") + 1, content.lastIndexOf(";"));
      try { subtopicsMap = JSON.parse(jsonStr); } catch(e) {}
  } else if (fs.existsSync("./subtopics_temp.json")) {
      try { subtopicsMap = JSON.parse(fs.readFileSync("./subtopics_temp.json", "utf-8")); } catch(e) {}
  }
  
  const remaining = topicsToProcess.filter(t => !subtopicsMap[t.name]);
  console.log(`Processing ${remaining.length} topics...`);
  
  if (remaining.length === 0) {
    console.log("All done! Finishing up updates.");
    fs.writeFileSync("./src/lib/subtopics.ts", "export const PREDEFINED_SUBTOPICS: Record<string, string[]> = " + JSON.stringify(subtopicsMap, null, 2) + ";\n");
    const content = fs.readFileSync("./src/lib/grammarTopics.ts", "utf-8");
    const updatedContent = content.replace(/section: "Spoken Practice"/g, 'section: "Learner Focus"');
    fs.writeFileSync("./src/lib/grammarTopics.ts", updatedContent);
    return;
  }
  
  const batchSize = 10;
  for (let i = 0; i < remaining.length; i += batchSize) {
     const batch = remaining.slice(i, i + batchSize);
     console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(remaining.length / batchSize)}`);
     const promises = batch.map(async (t) => {
         const promptText = `Generate exactly 8 highly specific sub-topics for someone who is learning English specifically from the perspective of: "${t.name}".
These should represent the unique daily situations, pain points, or professional moments where this person needs to use or practice English (e.g. at the workplace, with foreigners, in school).
Return the result STRICTLY as a JSON array of strings, written in Bengali (Bangla).`;
         const subtopics = await callModel(promptText);
         console.log(`Done: ${t.name} (${subtopics.length} items)`);
         subtopicsMap[t.name] = subtopics;
     });
     await Promise.all(promises);
     fs.writeFileSync("./subtopics_temp.json", JSON.stringify(subtopicsMap, null, 2));
  }
  
  fs.writeFileSync("./src/lib/subtopics.ts", "export const PREDEFINED_SUBTOPICS: Record<string, string[]> = " + JSON.stringify(subtopicsMap, null, 2) + ";\n");
  console.log("Done saving to src/lib/subtopics.ts");
  
  const content = fs.readFileSync("./src/lib/grammarTopics.ts", "utf-8");
  const updatedContent = content.replace(/section: "Spoken Practice"/g, 'section: "Learner Focus"');
  fs.writeFileSync("./src/lib/grammarTopics.ts", updatedContent);
  console.log("Updated grammarTopics.ts");
}
main();
