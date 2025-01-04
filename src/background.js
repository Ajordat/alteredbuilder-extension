import { encodeList } from "altered-deckfmt";


if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    console.log("Deck Importer Extension Installed!");
});

const MAX_ITEMS_PER_PAGE = 36;

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

async function fetchPartialCollection(itemsPerPage, pageIndex, accessToken) {

    const response = await fetch(`https://api.altered.gg/cards/stats?collection=true&itemsPerPage=${itemsPerPage}&page=${pageIndex}&cardType[]=SPELL&cardType[]=PERMANENT&cardType[]=CHARACTER&cardType[]=HERO`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to extract partial collection at page ${pageIndex}.`);
    }

    return await response.json();
}

function collectionIterator(itemsPerPage, accessToken, port) {
    let currentPage = 1;
    let lastPage = 1;

    return {
        async *[Symbol.asyncIterator]() {
            do {
                const collectionPage = await fetchPartialCollection(itemsPerPage, currentPage, accessToken);

                yield collectionPage["hydra:member"];

                let totalItems = collectionPage["hydra:totalItems"];
                lastPage = Math.ceil(totalItems / itemsPerPage);

                port.postMessage({ step: "progress", value: (currentPage / lastPage) * 100 });

                currentPage += 1;
            } while (currentPage <= lastPage);
        }
    }
}

async function extractCollection(accessToken, port) {
    const collectionPage = collectionIterator(MAX_ITEMS_PER_PAGE, accessToken, port);
    const collection = {};

    for await (const page of collectionPage) {
        for (const card of page) {
            collection[card["reference"]] = card["inMyCollection"];
        }
        // break;
    }

    return collection;
}

function formatCollection(collection) {
    return Object.entries(collection).map(([reference, count]) => `${count} ${reference}`).join("\n");
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("received message: " + message.action);
    if (message.action === "importDeck") {

        (async () => {
            try {
                let deck = parseDecklist(message.decklist, message.deckName, message.actions);

                const token = await getNextAuthToken();
                deck.id = await createBaseDeck(deck, token);
                await addCards(deck, token);

                sendResponse({ success: true, url: `http://altered.gg/decks/${deck.id}` });

            } catch (error) {
                console.error("Error importing deck:", error);
                sendResponse({ success: false, msg: error.message });
            }
        })();

        return true;
    }
    return false;
});

browser.runtime.onConnect.addListener((port) => {
    console.log("connected to popup: " + port.name);

    port.onMessage.addListener((message) => {
        if (message.action == "extractCollection") {
            (async () => {
                try {
                    const token = await getNextAuthToken();
                    let collection = await extractCollection(token, port);

                    let text = formatCollection(collection);

                    port.postMessage({
                        step: "response", success: true, collection: text,
                        // short: encodeList(text)
                    });

                } catch (error) {
                    console.error("Error extracting collection:", error);
                    port.postMessage({ step: "response", success: false, msg: error.message });
                }
            })();
        }
    })
    // Handle disconnection
    port.onDisconnect.addListener(() => {
        console.log("Popup disconnected.");
    });
});