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


fetch() resolves the Promise no matter what, as long as it gets any HTTP response (even 404 or 500). So we change change is response ok, it means promise is not rejected.

fetch() only rejects the Promise if it couldn’t connect at all — like network down, DNS failure, or invalid URL.

Here's what's happening:

fetch() is asynchronous — returns a Promise<Response>.

Once you get the Response object, its body is still a stream.

response.json() reads that stream and parses the text into a JavaScript object — that takes time (especially for large payloads).

So response.json() is also asynchronous and returns a Promise<any>

Because the body might be large or chunked (streamed), and JavaScript's runtime doesn't block I/O synchronously — it uses the event loop and promises to stay non-blocking.
There’s no synchronous alternative, because reading from the network (or body stream) must be async in the browser or Node.js.

When you call fetch(), you get a Response object immediately — even before the body is fully read.

The response body is a stream of data (not a complete string yet).

response.json() starts reading that stream and deserializing it into a JS object.

But that takes time, so it returns a Promise that eventually resolves to the actual object.

If you don’t await it, you just get the Promise — not the data.