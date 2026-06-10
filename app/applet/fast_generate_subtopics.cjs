const fs = require('fs');
const tsContent = fs.readFileSync('./src/lib/grammarTopics.ts', 'utf8');

const regex = /{ name: "([^"]+)", category: "([^"]+)"[^\n]+section: "Learner Focus"/g;
let match;
let subtopicsMap = {};

const fallbackTemplates = [
  "Understanding foundational concepts of {TOPIC} (বেসিক ধারণা)",
  "Daily vocabulary and phrases for {TOPIC} (প্রতিদিনের ব্যবহার্য শব্দ)",
  "How to introduce yourself in the context of {TOPIC} (নিজের পরিচয় দেওয়া)",
  "Common questions and answers in {TOPIC} (সাধারণ প্রশ্নোত্তর)",
  "Communicating via email for {TOPIC} (ইমেইলে যোগাযোগ)",
  "Expressing opinions politely regarding {TOPIC} (মতামত প্রকাশ)",
  "Professional telephone etiquette for {TOPIC} (টেলিফোনে কথা বলা)",
  "Describing problems and seeking help in {TOPIC} (সমস্যা জানানো)",
  "Giving feedback and suggestions for {TOPIC} (মতামত দেওয়া)",
  "Dealing with difficult situations in {TOPIC} (কঠিন পরিস্থিতি সামলানো)",
  "Discussing future plans and goals related to {TOPIC} (ভবিষ্যৎ পরিকল্পনা)",
  "Negotiating and concluding discussions in {TOPIC} (দরকষাকষি)",
  "Presentation skills related to {TOPIC} (উপস্থাপন দক্ষতা)",
  "Essential grammar tips specifically for {TOPIC} (গ্রামার টিপস)",
  "How to give status updates about {TOPIC} (আপডেট জানানো)",
  "Asking for clarification when learning about {TOPIC} (প্রশ্ন করা)",
  "Apologizing for mistakes in {TOPIC} (ভুল স্বীকার করা)",
  "Encouraging colleagues or peers in {TOPIC} (উৎসাহ দেওয়া)",
  "Requesting favors or help in {TOPIC} (অনুরোধ করা)",
  "Participating in Q&A sessions about {TOPIC} (প্রশ্নোত্তর পর্ব)",
  "Discussing specific details of {TOPIC} (বিস্তারিত আলোচনা)",
  "Video call etiquette for {TOPIC} (ভিডিও কলে কথা বলা)",
  "Highlighting skills and achievements in {TOPIC} (দক্ষতা তুলে ধরা)",
  "Handling emergencies related to {TOPIC} (জরুরি অবস্থা সামলানো)",
  "Networking with others in the field of {TOPIC} (নেটওয়ার্কিং)"
];

while ((match = regex.exec(tsContent)) !== null) {
  const name = match[1];
  const category = match[2];
  
  let topics = [];
  for (let i = 0; i < 25; i++) {
    topics.push(`${i+1}. ${fallbackTemplates[i].replace(/\{TOPIC\}/g, name)}`);
  }
  
  subtopicsMap[name] = topics;
}

const fileContent = `export const PREDEFINED_SUBTOPICS: Record<string, string[]> = ${JSON.stringify(subtopicsMap, null, 2)};\n`;
fs.writeFileSync("./src/lib/subtopics.ts", fileContent);
console.log("Generated subtopics for " + Object.keys(subtopicsMap).length + " topics.");
