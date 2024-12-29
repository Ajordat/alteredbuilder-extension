import './styles.css';


const ALLOWED_DOMAINS = "altered.gg";


if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener("DOMContentLoaded", async () => {
    const importButton = document.getElementById("import-button");
    const extractButton = document.getElementById("parse-collection");

    const navImport = document.getElementById("nav-import");
    const navOther = document.getElementById("nav-collection");
    const contentImport = document.getElementById("content-import");
    const contentCollection = document.getElementById("content-collection");

    navImport.addEventListener("click", () => {
        contentImport.classList.remove("d-none");
        contentCollection.classList.add("d-none");
        navImport.classList.add("active");
        navOther.classList.remove("active");
    });

    navOther.addEventListener("click", () => {
        contentCollection.classList.remove("d-none");
        contentImport.classList.add("d-none");
        navOther.classList.add("active");
        navImport.classList.remove("active");
    });

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        const currentTab = tabs[0];
        const currentUrl = new URL(currentTab.url);

        const invalidLocationContainer = document.getElementById("invalid-location-container");
        const mainContainer = document.getElementById("main-container");
        const errorContainer = document.getElementById("error-container");

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
        console.log("import button listener ready")
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
            action: 'importDeck', decklist: decklist, deckName: deckName, actions: { excludeUniques: excludeUniquesEl.checked }
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

    extractButton.addEventListener("click", async () => {
        const port = browser.runtime.connect({ name: "extract-collection-cnx" });
        const progressBar = document.getElementById("extractor-progress-bar");
        progressBar.classList.add("progress-bar-animated");

        port.postMessage({ action: "extractCollection" });

        port.onMessage.addListener((message) => {
            console.log("received message", message);
            if (message.step === "response") {
                if (message.success === true) {
                    document.getElementById("parsed-collection").value = message.collection;
                    progressBar.classList.remove("progress-bar-animated");
                }
            } else if (message.step === "progress") {
                let value = message.value;
                progressBar.style.width = `${value}%`;
                progressBar.setAttribute("aria-valuenow", value);
                progressBar.textContent = `${Math.floor(value)}%`;
            }
        })
    });

    document.getElementById("copy-collection").addEventListener("click", () => {
        const textarea = document.getElementById("parsed-collection");

        // Copy to clipboard
        navigator.clipboard.writeText(textarea.value).then(() => {
            alert("Decklist copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });

});
