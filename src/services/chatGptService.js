import axios from "axios";

// Retrieve OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Service object for interacting with the ChatGPT API
const chatGptService = {
  // Function to generate content using the ChatGPT API
  generateContent: async ({ userInput, chatGptPrompt }) => {
    try {
      // Send a POST request to the OpenAI API
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o", // Specify the model to use
          messages: [
            { role: "system", content: chatGptPrompt }, // System prompt
            { role: "user", content: JSON.stringify(userInput) }, // User input as JSON string
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`, // Include API key in headers
          },
        }
      );

      // Parse the API response content from JSON string to JavaScript object
      let responseContent = response.data.choices[0].message.content;

      if (responseContent.startsWith("```json")) {
        responseContent = responseContent.slice(7); // Remove the first 7 characters ("```json")
      }
    
      if (responseContent.endsWith("```")) {
        responseContent = responseContent.slice(0, -3); // Remove the last 3 characters ("```")
      }
      const apiJsonContent = JSON.parse(responseContent);

      // Check if the API response content is valid
      if (apiJsonContent) {
        return { success: true, content: apiJsonContent };
      }

      // Return error if the API response is invalid
      return { success: false, error: "Invalid response from API." };
    } catch (error) {
      // Log and return error if the API request fails
      console.error("ChatGPT API error:", error);
      return { success: false, error: error.message };
    }
  },
};

export default chatGptService;
