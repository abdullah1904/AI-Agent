import OpenAI from "openai"
import readlineSync from "readline-sync"

const OPEN_AI_KEY = ""

const client = new OpenAI({
    apiKey: OPEN_AI_KEY
});

// Tools
function getWeatherDetails(city) {
    if (city.toLowerCase() === 'new york city') {
        return "It is currently 70 degrees in New York City."
    }
    if (city.toLowerCase() === 'los angeles') {
        return "It is currently 80 degrees in Los Angeles."
    }
    if (city.toLowerCase() === 'chicago') {
        return "It is currently 60 degrees in Chicago."
    }
    if (city.toLowerCase() === 'miami') {
        return "It is currently 90 degrees in Miami."
    }
    if (city.toLowerCase() === 'houston') {
        return "It is currently 85 degrees in Houston."
    }
    return "I'm sorry, I do not have weather information for that city."
}

const tools = {
    'getWeatherDetails': getWeatherDetails
}


const SYSTEM_PROMPT = `
    You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
    Wait for the user prompt and first PLAN using available tools.
    After Planning, Take the action with appropriate tools and wait for Observation based on Action.
    Once you get the observation, Return the AI response based on START prompt and observations.

    Strictly follow the JSON output format as in examples

    Available Tools:
        - function getWeatherDetails(city: string): string
            getWeatherDetails is a function that accepts a city name as string and returns the weather details.

    EXAMPLE
        START 
        { "type": "user", "user": "What is the sum of weather in New York City and Los Angeles?" } 
        { "type": "plan", "plan": "I will call the getWeatherDetails function for New York City" }
        { "type": "action", "function": "getWeatherDetails", "input": "New York City" }
        { "type": "observation", "observation": "It is currently 70 degrees in New York City." }
        { "type": "plan", "plan": "I will call the getWeatherDetails function for Los Angeles" }
        { "type": "action", "function": "getWeatherDetails", "input": "Los Angeles" }
        { "type": "observation", "observation": "It is currently 80 degrees in Los Angeles." }
        { "type": "output", "output": "The sum of weather in New York City and Los Angeles is 150 degrees."}
`

const userPrompt = 'Hey AI, what is the weather in New York City?'

const messages = [
    { "role": "system", "content": SYSTEM_PROMPT },
]

while (true) {
    const query = readlineSync.question('>>');
    messages.push({ role: "user", content: JSON.stringify({ type: "user", user: query }) });
    while (true) {
        const chat = await client.chat.completions.create({
            model: "gpt-4o-mini",
            // @ts-ignore
            messages: messages,
            response_format: { type: "json_object" }
        });
        const result = chat.choices[0].message.content;
        messages.push({ role: "assistant", content: result });
        console.log("\n\n--- AI Start ---")
        console.log(result)
        console.log("--- AI End ---\n\n")
        const call = JSON.parse(result)
        if (call.type == "output") {
            console.log(`AI: ${call.output}`)
            break;
        }
        else if (call.type == "action") {
            const fn = tools[call.function];
            const observation = fn(call.input);
            const obs = { "type": "observation", "observation": observation }
            messages.push({ role: "developer", content: JSON.stringify(obs) });
        }
    }
}
