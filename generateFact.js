require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function GenerateFact(num){
    let found = true;
    try {
        const response = await ai.interactions.create({
            model: "gemini-2.5-flash",
            input: `
                Give me one short, fascinating fact meaningfully related to the number ${num}.

                The fact can come from any area of human knowledge: history, science, nature, geography, technology, art, culture, language, sports, human behaviour, mathematics, or anything else.

                Prioritize facts that make an ordinary person think “Wait, WHAT?”, laugh, feel amazed, or want to tell someone else. The audience is a general Discord community, not necessarily nerds or academics. Make the fact accessible, surprising, and exciting without requiring specialist knowledge.

                The number must have a genuine, explainable connection to the fact. It could represent an age, date, quantity, measurement, record, duration, name, scientific constant, historical event, or any other meaningful relationship. The fact does not have to be mathematical, and the number does not need to be the main subject of the fact, but its connection must be more than a coincidence, a passing mention, or a forced association.

                Prefer obscure but verifiable discoveries, bizarre real-world details, counterintuitive truths, extraordinary achievements, and unexpected connections over familiar trivia and ordinary statistics.

                Be accurate. Never invent facts, exaggerate claims, or force a connection just to make the number seem interesting. If you cannot find a sufficiently interesting, reliable fact genuinely connected to the exact input number, return NO FACT instead.

                Keep the fact to at most two short sentences. Use natural, conversational language with a strong payoff. No introduction, generic commentary, unnecessary jargon, or explanation of your reasoning.

            ` 
        });
        if (response.output_text === "NO FACT") found = false; 
        return { found, text: response.output_text, error: "NO FACT" };
    } catch (error) {
        found = false;
        return { found, text: null, error };
    };
};

module.exports = { GenerateFact };