// export const callLLM = async (prompt) => {
//   const response = await fetch("http://localhost:11434/api/generate", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: "mistral",
//       prompt,
//       stream: false
//     })
//   });

//   if (!response.ok) {
//     throw new Error("Failed to call Ollama");
//   }

//   const data = await response.json();

//   return data.response.trim();
// };
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const callLLM = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // ✅ current production model
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });

  return response.choices[0].message.content.trim();
};
