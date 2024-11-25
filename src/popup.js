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
        const deckNameEl = document.getElementById("deck-name");
        const decklistEl = document.getElementById("decklist-text");
        let isInvalid = false;

        if (deckNameEl.value.trim() === "") {
            deckNameEl.classList.add("is-invalid");
            deckNameEl.classList.remove("is-valid");
            isInvalid = true;
        } else {
            deckNameEl.classList.add("is-valid");
            deckNameEl.classList.remove("is-invalid");
        }

        if (decklistEl.value.trim() === "") {
            decklistEl.classList.add("is-invalid");
            decklistEl.classList.remove("is-valid");
            isInvalid = true;
        } else {
            decklistEl.classList.remove("is-invalid");
            decklistEl.classList.add("is-valid");
        }

        if (isInvalid) {
            return;
        }

        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            console.log(tabs);
            console.log("decklist: " + decklistEl.value)
            const currentTab = tabs[0];

            browser.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: importDeck,
                args: [decklistEl.value, deckNameEl.value]
            }).then(() => {
                console.log("Script executed successfully")
            }).catch((error) => {
                console.error("Error executing script: ", error);
            });
        });
    });
});

async function importDeck(decklistText, deckName) {

    console.log("inside:" + decklistText);
    console.log("deck name: " + deckName);

    if (typeof browser === "undefined") {
        var browser = chrome;
    }

    browser.runtime.sendMessage({
        action: 'importDeck', decklist: decklistText, deckName: deckName
    }).then(response => {
        console.log("Response from background script:", response);
    }).catch(error => {
        console.error("Error sending message:", error);
    });
    console.log("message sent");
}
