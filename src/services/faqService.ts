import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FAQ_DATA = [
  {
    question: "What is this chatbot?",
    answer: "This is a simple FAQ chatbot built with React and Gemini to help answer common questions about our services."
  },
  {
    question: "How does it work?",
    answer: "It uses Google's Gemini AI to understand your questions and provide relevant answers based on our FAQ database."
  },
  {
    question: "Is it free to use?",
    answer: "Yes, this demo chatbot is completely free to use!"
  },
  {
    question: "Which platforms does it support?",
    answer: "It's a web-based application, so it works on any device with a modern web browser, including mobile phones, tablets, and desktops."
  }
];

const SYSTEM_INSTRUCTION = `
You are a helpful FAQ assistant. 
Your goal is to answer user questions based on the following FAQ data:
${JSON.stringify(FAQ_DATA, null, 2)}

If a question is not covered by the FAQ, politely inform the user and try to provide a general helpful response if possible, or suggest they contact support.
Keep your answers concise and friendly.
`;

export async function getChatResponse(history: { role: string; parts: { text: string }[] }[], message: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I'm sorry, I couldn't process that request.";
}
