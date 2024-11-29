if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    console.log("Deck Importer Extension Installed!");
});


async function getNextAuthToken() {
    const response = await fetch("https://www.altered.gg/api/auth/session", { credentials: "include" });
    if (!response.ok) {
        throw new Error("Failed to authenticate.");
    }
    const data = await response.json();
    if (data.accessToken == undefined) {
        throw new Error("Failed to authenticate. Are you logged in?");
    }
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

    const responseObject = await response.json()
    return responseObject.id;
}

async function addCards(deck, accessToken) {

    const response = await fetch(`https://api.altered.gg/deck_user_lists/${deck.id}/add_cards`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ putOption: "update", cards: deck.cards }),
    });

    if (!response.ok) {
        throw new Error("Failed to add cards. Is the format of each line correct?\n(e.g. \"3 ALT_CORE_B_LY_13_R1\")");
    }
}

function parseDecklist(decklist, name, actions) {

    // Convert the hero to the CORE set
    let [faction, id, rarity] = decklist.split("\n", 1)[0].split("_").slice(3);

    if (!["01", "02", "03"].includes(id) || rarity !== "C") {
        console.error(`Invalid hero code ${decklist.split("\n", 1)[0].split(" ")[1]}`);
        throw new Error("The first line must be a valid hero reference\n(e.g. \"1 ALT_CORE_B_MU_01_C\")");
    }

    let cardEntries = decklist.split("\n").slice(1);
    if (actions.excludeUniques) {
        cardEntries = cardEntries.filter(entry => !entry.includes("_U_"));
    }

    return {
        hero: `ALT_CORE_B_${faction}_${id}_${rarity}`,
        cards: cardEntries.map((x) => ({ quantity: parseInt(x.split(" ")[0]), card: `/cards/${x.split(" ")[1]}` })),
        name: name,
        public: false
    }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "importDeck") {

        (async () => {
            try {
                let deck = parseDecklist(message.decklist, message.deckName, message.actions);

                const token = await getNextAuthToken();
                deck.id = await createBaseDeck(deck, token);
                await addCards(deck, token);

                sendResponse({ success: true, url: `http://altered.gg/decks/${deck.id}` });
                return;

            } catch (error) {
                console.error("Error importing deck:", error);
                sendResponse({ success: false, msg: error.message });
            }
        })();

        return true;
    }
    return false;
});
