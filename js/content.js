// This script runs in the context of web pages
// It can extract and send page content to the popup

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content.js just received " + request);
    console.log("My sender object is " + sender);
    
    if (request.action === 'getPageContent') {
        const pageContent = extractPageContent();
        sendResponse({ content: pageContent });
    }
    return true; // For future compatibility - Required for async response - chrome extensions
});


function extractPageContent(){
    const neededContent = document.querySelector('main, article, .main-content, .main-article, .blog-post, .text-body, [role="main"], [role="document"]') || document.body;
    
    const content = neededContent.innerText.replace(/[\t\n\s]+/g,' ').trim();

    const maxLengthofContent = 10000;
    if (content.length > maxLengthofContent){
        content = content.substring(0, maxLengthofContent) + '...';
    }

    return content;

}