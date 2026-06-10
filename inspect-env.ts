import { GoogleGenAI } from "@google/genai";

async function inspect() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No GEMINI_API_KEY configured.");
    return;
  }
  
  console.log("API Key length:", apiKey.length);
  // Log the first few chars and last few chars of the key
  console.log("API Key Prefix:", apiKey.substring(0, 10));
  console.log("API Key Suffix:", apiKey.substring(apiKey.length - 10));
  
  // Let's print all env keys starting with GOOGLE, FIREBASE, PORT, GCLOUD, GCP, etc.
  console.log("\nFiltered Env keys:");
  for (const key of Object.keys(process.env)) {
    if (key.match(/google|project|gcp|firebase|client|applet/i)) {
      console.log(`${key}: ${process.env[key]?.substring(0, 30)}...`);
    }
  }
}

inspect();
