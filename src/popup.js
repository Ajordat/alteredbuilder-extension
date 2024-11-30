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

        let invalidLocationContainer = document.getElementById("invalid-location-container");
        let mainContainer = document.getElementById("main-container");
        let errorContainer = document.getElementById("error-container");

        if (currentUrl.hostname.includes(ALLOWED_DOMAINS)) {
            invalidLocationContainer.classList.add("d-none");
            mainContainer.classList.remove("d-none");
        } else {
            invalidLocationContainer.classList.remove("d-none");
            mainContainer.classList.add("d-none");
        }
        errorContainer.classList.add("d-none");
    });

    importButton.addEventListener("click", async () => {
        const deckNameEl = document.getElementById("deck-name");
        const decklistEl = document.getElementById("decklist-text");
        const excludeUniquesEl = document.getElementById("exclude-uniques");
        let isInvalid = false;

        let decklist = decklistEl.value.trim();
        let deckName = deckNameEl.value.trim();

        if (deckName === "") {
            deckNameEl.classList.add("is-invalid");
            deckNameEl.classList.remove("is-valid");
            isInvalid = true;
        } else {
            deckNameEl.classList.add("is-valid");
            deckNameEl.classList.remove("is-invalid");
        }

        if (decklist === "") {
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

        browser.runtime.sendMessage({
            action: 'importDeck', decklist: decklist, deckName: deckName, actions: {excludeUniques: excludeUniquesEl.checked }
        }).then(response => {
            if (response.success === true) {
                chrome.tabs.create({ url: response.url });
            } else {
                let errorContainer = document.getElementById("error-container");
                let errorMsg = document.getElementById("error-msg");

                errorMsg.innerText = response.msg;
                errorContainer.classList.remove("d-none");
            }
        }).catch(error => {
            console.error("Error sending message:", error);
        });
    });
});
