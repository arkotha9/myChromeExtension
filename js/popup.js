// Import config
import { CONFIG } from './config.js';

//Waits until all DOM elements (like your button) are available.Only then attaches your event handler
// Wait for the popup's DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarize');
    const summaryDiv = document.getElementById('summary');

    // Add click handler for the summarize button
    summarizeBtn.addEventListener('click', async function() {
        summaryDiv.textContent = 'Thinking...';

        try {
            //1.get current active tab in current window
            const [tab] = await chrome.tabs.query({ active:true, currentWindow:true});

           //get content from content script
           chrome.tabs.sendMessage(
            tab.id, 
            { action: "getPageContent" }, 
            async(response) => {
                //3. Call Perplexity API
                try{
                    console.log('Response received from window:', response);
                    if(response && response.content){
                        //4. Get summary from API
                        const summary = await getSummaryFromAPI(response);
                        summaryDiv.textContent = summary;
                    }
                    else{
                        summaryDiv.textContent = 'No content received from the page';
                    }                    
                }
                catch(error){
                    console.error('Error in receiving response from window:', error);
                    summaryDiv.textContent = 'Error in receiving response from window: ' + error.message;
                }
            }
        );
        } catch (error) {
            console.error('Error:', error);
            summaryDiv.textContent = 'Error: ' + error.message;
            return `Error: ${error.message}`;
        }
    });
});


async function getSummaryFromAPI(contentInJson) {
    // You would typically make a fetch request to your backend here
    //ref: https://ai.google.dev/api/generate-content#v1beta.models.generateContent
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.API_KEY}`;
    
    //Prompts
    // const prompt = `Summarize the content: ${contentInJson.content}`;

    const chessPrompt = `I am playing as White in this chess game. The moves made so far are in PGN format: ${contentInJson.content}

                        Each numbered entry represents a turn:
                        - The **first move** (e.g., "e4") is mine (White),
                        - The **second move** (e.g., "e5") is my opponent's (Black).
                        
                        If there are no moves yet, suggest a strong opening move for White.
                        
                        Your response must follow these rules:
                        1. Do NOT use chess abbreviations like K, Q, N, etc. State the piece
                        2. Use only square names like "e4", "g5", etc.
                        3. Say clearly which of **my pieces (White)** to move, and to where.
                        4. ONLY suggest a move for me — not for my opponent.
                        5. Respond in this format:
                           - "Move your [piece] from [square] to [square]."
                        
                        Examples:
                        - "Move your pawn from e2 to e4."
                        - "Move your bishop to g5."
                        - "Move your rook from a1 to d1."
                        
                        Keep it concise and do not describe my opponent's pieces.`;
                        
    try{
        const response = await fetch(url, {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'            
            },
            body: JSON.stringify({
                "contents": [ {
                    "parts": [ {
                        "text": chessPrompt
                    } ]
                } ]
            })
        })
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to generate summary via Gemini');
        }

        const data = await response.json();
        console.log('Response received from Gemini:', data);
        
        //optional chaining with ?. to handle null or undefined
        return data.candidates.length > 0 ? data.candidates?.[0]?.content?.parts?.[0]?.text: 'Failed to deserialize response from Gemini';

    }
    catch(error){
        console.error('Error in getting summary from Gemini', error);
        return `Error in getting summary from Gemini: ${error.message}`;
    }
}