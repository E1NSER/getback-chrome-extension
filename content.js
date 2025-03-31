var settings = {};

var getSettings = function (cbContinue) {
    chrome.runtime.sendMessage({cmd: "settings.get"}, function (data) {
        settings = data || {};
        if (cbContinue) cbContinue();
    });
};

var requestScriptInjection = function () {
    if (!settings["inject-script"] || !settings["getback-id"]) return;

    let baseUrl = settings["network"] ? "https://www.sovopt.com/" : "https://www.getback.ch/";
    if (settings["dev"]) baseUrl = baseUrl.replace("www", "www-dev");

    let scriptUrl = baseUrl + settings["getback-id"];
    console.log("Requesting script injection from service worker:", scriptUrl);

    chrome.runtime.sendMessage({ cmd: "fetch-script", scriptUrl });
};

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    getSettings(() => {
        requestScriptInjection();
    });
});

// Listen for settings updates and re-inject if needed
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.cmd === "settings.set") {
        settings[request.data.key] = request.data.value;
        requestScriptInjection();
    }
});