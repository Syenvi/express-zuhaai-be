import { buildPrompt } from "../utils/build-prompt.js";
import { openai } from "./openai-client.js";

export const handleAiResponse = async (agent, products, userMessage) => {
  const messages = buildPrompt(agent, products, userMessage);

  const completion = await openai.chat.completions.create({
    model: "llama3-70b-8192",
    messages,
  });

  // console.log("raw :", completion.choices[0].message.content);

  return completion.choices[0].message.content;
};
