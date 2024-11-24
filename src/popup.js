import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';


const ALLOWED_DOMAINS = "altered.gg";


if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener("DOMContentLoaded", async () => {
    let importButton = document.getElementById("import-button");

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        const currentTab = tabs[0];
        const currentUrl = new URL(currentTab.url);

        let errorContainer = document.getElementById("error-container");
        let mainContainer = document.getElementById("main-container");

        if (currentUrl.hostname.includes(ALLOWED_DOMAINS)) {
            errorContainer.classList.add("d-none");
            mainContainer.classList.remove("d-none");
        } else {
            errorContainer.classList.remove("d-none");
            mainContainer.classList.add("d-none");
        }
    });

    importButton.addEventListener("click", async () => {
        const decklist = document.getElementById("decklist-text").value;

        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log(tabs);
            console.log("decklist: " + decklist)
            const currentTab = tabs[0];

            browser.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: importDeck,
                args: [decklist]
            }).then(() => {
                console.log("Script executed successfully")
            }).catch((error) => {
                console.error("Error executing script: ", error);
            });
        });
    });
});

async function importDeck(decklistText) {

    console.log("inside:" + decklistText);

    if (typeof browser === "undefined") {
        var browser = chrome;
    }

    browser.runtime.sendMessage({
        action: 'importDeck', decklist: decklistText
    }).then(response => {
        console.log("Response from background script:", response);
    }).catch(error => {
        console.error("Error sending message:", error);
    });
    console.log("message sent");
}
