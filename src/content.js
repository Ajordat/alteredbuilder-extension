// Content script (content.js)
window.addEventListener("message", (event) => {
    console.log(event)
    if (event.source !== window) return; // Ignore messages from other frames

    if (event.data.action === "importDeck") {
        console.log("Forwarding decklist to background script:", event.data.decklist);
        browser.runtime.sendMessage(event.data).catch((error) => {
            console.error("Error forwarding message to background script:", error);
        });
    }
});
