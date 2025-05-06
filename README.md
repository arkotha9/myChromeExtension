# myChromeExtension
I am creating a chrome extension using Perplexity API and JS

Event Loop Flow in Content.js:
[Message Received] → [Message Handler Starts]
                       ↓
                [extractPageContent() runs]  ← Synchronous, blocks until done
                       ↓
                [sendResponse() called]      ← Only after extraction completes
                       ↓
                [Handler returns true]       ← Keeps message port open for async

The return true keeps the message port open for async responses. However, in my current code, there's no actual async operation - everything is synchronous.  If I had async operations (like fetch), I'd need to handle them with async/await or Promises.


1. In popup.js,
- You might think:

Only the API call is async, so the outer click handler doesn't need to be.

But in fact:

chrome.tabs.query(...) returns a Promise, so you need await.

And await requires the enclosing function to be async.

So the outer function is async for that reason—not because of the Perplexity API call, which is deeper in the call stack.

---------------------------------------
popup.js (UI logic)
   ↓
chrome.tabs.sendMessage(tabId, { action: "getPageContent" })
   ↓
content.js (runs on the tab, scrapes the DOM)
   ↓
Responds with page content
   ↓
popup.js receives it and sends it to the API
   ↓
API processes it and sends back a response
   ↓
popup.js updates the UI with the response
