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
    const apiKey = "AIzaSyAtZ7F6zfr0GIG4QRr-9LpdnXxFpOU8Y8s";

    //ref: https://ai.google.dev/api/generate-content#v1beta.models.generateContent
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    //Prompts
    // const prompt = `Summarize the content: ${contentInJson.content}`;
    const chessPrompt = `You are a chess grandmaster. Given the following chess game moves so far:\n${contentInJson.content}\n.Suggest my next best move to win the game. Respond with the move in user friendly explanation and standard pgn.`;


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