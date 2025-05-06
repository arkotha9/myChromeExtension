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