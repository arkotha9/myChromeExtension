// This script runs in the context of web pages
// It can extract and send page content to the popup

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content.js just received the request for " + request.action);
    console.log("My request sender object is ", sender);
    
    if (request.action === 'getPageContent') {
        const pageContent = extractPageContent();
        sendResponse({ content: pageContent });
    }
    return true; // If above fn was async, then u shouldnt close off the port - Required for async response - chrome extensions
});


function extractPageContent(){
    try{
        const gameMovesSpans = document.querySelectorAll('#scroll-container .main-line-row span.node-highlight-content');
        // returns empty node list of spans or non emtpy list of spans
        if(gameMovesSpans.length === 0){
            throw new Error('No span elements found');
        }
        console.log("Found " + gameMovesSpans.length + " span elements");

        const moves = [];
        gameMovesSpans.forEach(span => {
            const move = span.textContent.trim();
            if(move){
                moves.push(move)
            }
            
        })
        // moves.forEach(move => {
        //     console.log(move + " ");
        // })
        // console.log("Finished printing moves\n");

        const pgnString = moves.map((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            return index % 2 === 0 ? `${moveNumber}. ${move}` : move;
        }).join(' ');
        
        console.log("PGN String generated: " + pgnString);
        return pgnString;
    }
    catch(error){
        console.error('Error in extracting span elements to create the PGN string: ', error.message);
        return `Error in extracting span elements to create the PGN string: ${error.message}`;
    }
}