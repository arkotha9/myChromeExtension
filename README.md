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

When a Promise object is resolved, it returns the value that was passed to it when it was resolved. This value can be anything: a simple value (like a number or string), an object, or even another promise.


The Key Idea: async Functions and Promises
When you mark a function as async, that function always returns a promise, regardless of what you return from it. Even if you return a simple value, like a string or an object, JavaScript automatically wraps it in a promise


Fetch api content type is json bu u have to send body as a string

Google API ref for POST: https://ai.google.dev/api/generate-content

Request Body:
{
  "contents": [
    {
      "parts": [
        {
          "text": "your prompt here"
        }
      ]
    }
  ]
}

Response Body:
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "your response here"
          }
        ]
      }
    }
  ]
}
------------------------------------------------------------------------------------

// textContent: "\n  Hello\n  World\n  p { color: red; }\n"
console.log(document.getElementById('example').textContent);

// innerText: "" (empty string because parent is hidden)
console.log(document.getElementById('example').innerText);

Block Scope: Each iteration of forEach creates a new block scope. The const move is created fresh in each iteration.
So we na use const move and const moves = [] bcoz array reference is not changing


--------------------------
permissions = “What am I allowed to do?”

host_permissions = “Where am I allowed to do it?”

------------------------------------------------------------------
1.In modern JavaScript, to share variables/functions between files, we need to explicitly export them using the export keyword. Without export, the CONFIG object would only be available within config.js and couldn't be accessed by other files

2. Chrome extensions have strict security policies. 
By default, extension files can't be accessed by other parts of the extension
This manifest entry explicitly tells Chrome that config.js should be accessible to other parts of the extension
Without this, the import statement in popup.js would fail because Chrome would block access to config.js

3. Regular scripts can't use import/export statements - they must be modules. So in html file, we load popup.js as module so that it can use the import statement.

Key features of modules:
Each module has its own scope (variables/functions aren't automatically global)
You must explicitly export what you want to share
You must explicitly import what you want to use
They use import and export statements
They must be loaded with type="module" in HTML

Wihtout modules, we would have had to do this:
window.CONFIG = { API_KEY: "..." };  // Global variable

// popup.js
const apiKey = window.CONFIG.API_KEY;  // Accessing global variable

---------

Summary:
Use content scripts when your code needs to interact with the webpage DOM directly.

Use web accessible resources when you need to load files from your extension into the webpage’s JS scope (e.g., loading chess.js directly on the page).

--Design Choices:
Chess.js is not present as an ES module so cant import or export it. So added it as a script to load before popup.js so that it is avaialbale via the global window object


-------------------
Reger in JS 
const regex = /pattern/flags;
like in ches moves: regex = /from\s+[a-h][1-8]\s+to\s+[a-h][1-8]\s+/i


### I realized that just LLM and chess.js will not ive winning moves. I need to use a chess engine which suggests the best move.