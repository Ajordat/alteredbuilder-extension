if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    console.log("Deck Importer Extension Installed!");
});


async function getNextAuthToken() {
    const response = await fetch("https://www.altered.gg/api/auth/session", { credentials: "include" });
    if (!response.ok) {
        throw new Error("Failed to retrieve token");
    }
    const data = await response.json();
    return data.accessToken;
}

async function createBaseDeck(deck, accessToken) {

    const response = await fetch("https://api.altered.gg/deck_user_lists", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ alterator: `/cards/${deck.hero}`, name: deck.name, public: deck.public }),
    });

    if (!response.ok) {
        throw new Error("Failed to import deck");
    }
    console.log(response);
    const responseObject = await response.json()
    console.log(responseObject)
    return responseObject.id;
}

async function addCards(deck, accessToken) {

    const apiResponse = await fetch(`https://api.altered.gg/deck_user_lists/${deck.id}/add_cards`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ putOption: "update", cards: deck.cards }),
    });

    if (!apiResponse.ok) {
        throw new Error("Failed to import deck");
    }
    console.log(apiResponse);
}

function parseDecklist(decklist) {
    console.log(decklist);

    return {
        hero: decklist.split("\n", 1)[0].split(" ")[1].replace("COREKS", "CORE"),
        cards: decklist.split("\n").slice(1).map((x) => ({ quantity: parseInt(x.split(" ")[0]), card: `/cards/${x.split(" ")[1]}` })),
        name: "TEST",
        public: false
    }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Received message");
    if (message.action === "importDeck") {
        console.log("Received importDeck action")
        
        let deck = parseDecklist(message.decklist);
        console.log(deck)

        try {
            const token = await getNextAuthToken();

            deck.id = await createBaseDeck(deck, token);

            await addCards(deck, token);

            console.log("Deck imported successfully");
            sendResponse({ success: true });
        } catch (error) {
            console.error("Error importing deck:", error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return false;
});
