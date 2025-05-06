//Waits until all DOM elements (like your button) are available.Only then attaches your event handler
// Wait for the popup's DOM to be fully loaded

document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarize');
    const summaryDiv = document.getElementById('summary');

    // Add click handler for the summarize button
    summarizeBtn.addEventListener('click', async function() {
        summaryDiv.textContent = 'Summarizing...';

        try {
            //1.get current active tab in current window
            const [tab] = await chrome.tabs.query({ active:true, currentWindow:true});

           //2. Send message to content.js
           chrome.tabs.sendMessage(
            tab.id, 
            { action: "getPageContent" }, 
            async(response) => {
                //3. Call Perplexity API-  repsonse is not the response object but plain JS object
                try{
                    if (!response || !response.content) {
                        throw new Error('No content received from content.js');
                    }
                    console.log('Response received from curr window context.js:', response.content);
                    if(response && response.content){
                        //4. Get summary from API
                        const summary = await getSummaryFromAPI(response.content);
                        summaryDiv.textContent = 'My pokemon is ' + summary.name + ' and its height is ' + summary.height;
                    }
                    else{
                        summaryDiv.textContent = 'Request succesful but No content received from Content.js';
                    }                    
                }
                catch(error){
                    console.error('Error in receiving response json object from Content.js:', error);
                    summaryDiv.textContent = 'Error in receiving response json object from Content.js: ' + error.message;
                }
            }
        );
        } 
        catch (error) {
            console.error('Error in sending message to content.js:', error);
            summaryDiv.textContent = 'Error in sending message to content.js: ' + error.message;
        }
    });
});


// Mock API call - replace with actual API call
async function getSummaryFromAPI(content) {
    // You would typically make a fetch request to your backend here
    try{
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/charizard');
        if(!response.ok){
            throw new Error('Failed to fetch pokemon data from pokemon API');
        }
        const data = await response.json();
        return data;
    }
    catch(error){
        console.error('Error in fetching pokemon data from pokemon API:', error);
        throw error;
    }
}