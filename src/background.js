if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    console.log("Deck Importer Extension Installed!");
});
