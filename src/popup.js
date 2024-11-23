if (typeof browser === "undefined") {
    var browser = chrome;
}

const ALTERED_BUILDER_URL = "https://altered.ajordat.com";

document.addEventListener("DOMContentLoaded", async () => {
    const deckSelect = document.getElementById("deck-select");
    const importButton = document.getElementById("import-button");

    const loginButton = document.getElementById("login-button");
    const statusText = document.getElementById("status");

    loginButton.addEventListener("click", () => {
        // Redirect to your website's login page
        const loginUrl = ALTERED_BUILDER_URL + "/login?redirect_uri=" + encodeURIComponent(browser.identity.getRedirectURL());
        console.log(loginUrl);
        return;

        // Open login page
        browser.identity.launchWebAuthFlow({
            url: loginUrl,
            interactive: true
        }).then(token => {
            if (token) {
                // Store the token securely
                browser.storage.local.set({ authToken: token });
                statusText.textContent = "Logged in successfully!";
            } else {
                statusText.textContent = "Login failed. Please try again.";
            }
        }).catch(error => {
            console.error("Error during login:", error);
            statusText.textContent = "An error occurred.";
        });
    });


    // Fetch user's decks from your platform
    const decks = await fetchUserDecks();

    // Populate dropdown
    decks.forEach(deck => {
        const option = document.createElement("option");
        option.value = deck.id;
        option.textContent = deck.name;
        deckSelect.appendChild(option);
    });

    // Handle Import Button
    importButton.addEventListener("click", async () => {
        const selectedDeckId = deckSelect.value;
        const setting1 = document.getElementById("setting1").checked;
        const setting2 = document.getElementById("setting2").checked;

        // Send the selected deck and settings to the official website
        browser.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
            browser.scripting.executeScript({
                target: { tabId: tab.id },
                func: importDeck,
                args: [selectedDeckId, setting1, setting2]
            });
        });
    });

    document.getElementById("logout-button").addEventListener("click", () => {
        browser.storage.local.remove("authToken", () => {
            alert("Logged out successfully!");
        });
    });

});

async function fetchUserDecks() {
    const { authToken } = await browser.storage.local.get("authToken");

    if (!authToken) {
        throw new Error("User is not authenticated.");
    }

    const response = await fetch(ALTERED_BUILDER_URL + "/api/decks", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${authToken}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch decks.");
    }

    return response.json();
}


async function importDeck(deckId, setting1, setting2) {
    const token = document.cookie.match(/Bearer\s([\w\-\.]+)/)[1]; // Extract Bearer token
    const deckData = await fetch(ALTERED_BUILDER_URL + `/api/decks/${deckId}`).then(res => res.json());

    const response = await fetch("https://altered.gg/api/deck/import", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            deck: deckData,
            setting1,
            setting2
        })
    });

    if (response.ok) {
        alert("Deck imported successfully!");
    } else {
        alert("Failed to import deck.");
    }
}
