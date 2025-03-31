(function () {
    var settings = {}, shopId;

    var showMessage = function (string) {
        var el = $(".message");
        el.text(string).show();
        setTimeout(() => el.hide(), 2000);
    };

    var getSettings = function (tabId, cbContinue) {
        chrome.runtime.sendMessage(
            {cmd: "settings.get", data: {tabId: tabId}},
            function (response) {
                settings = response || {}; // Only the settings for this tab
                if (!settings['getback-id'] && shopId) {
                    settings['getback-id'] = shopId;
                    setSetting('getback-id', shopId, tabId);
                }
                console.log("Settings loaded for tab", tabId, settings);
                if (cbContinue) cbContinue();
            }
        );
    };

    var setSetting = function (key, value, tabId) {
        chrome.runtime.sendMessage({
            cmd: "settings.set",
            data: {key: key, value: value, tabId: tabId}
        }, () => {
            console.log(`Saved setting: ${key} = ${value}`);
        });
    };

    var initSettings = function () {
        console.log("Initializing UI with settings:", settings);
        for (let key in settings) {
            let id = "#input-" + key;
            if (typeof settings[key] === "boolean") {
                $(id).prop("checked", settings[key]);
            } else if (typeof settings[key] === "string") {
                $(id).val(settings[key]);
            }
        }
    };

    var initUI = function (tabId) {
        console.log('init ui');
        $("input[type=checkbox]").change(function () {
            let key = this.id.replace("input-", "");
            setSetting(key, this.checked, tabId);
            showMessage("Saved");
        });

        $("#input-network").change(function () {
            $("#logo").attr("src", this.checked ? "/images/logo-sovendus.svg" : "/images/logo-adfocus.png");
        });

        $("input[type=text]").on("input", function () {
            let key = this.id.replace("input-", "");
            setSetting(key, this.value.trim(), tabId);
        });

        $("#save").click(function () {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.reload(tabs[0].id);
            });
        });
    };

    var getActiveTab = function (callback) {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            if (tabs[0]) callback(tabs[0]);
        });
    };

    var generateResults = function (tabId) {
        getSettings(tabId, function () {
            initSettings();
            initUI(tabId);
        });
    };

    var getQueryParam = function (url, param) {
        var urlObj = new URL(url);
        var urlParams = new URLSearchParams(urlObj.search);
        return urlParams.get(param);
    };

    getActiveTab(function (tab) {
        console.log('active tab:', tab);
        shopId = getQueryParam(tab.url, 'gb_shop');
        generateResults(tab.id);
    });
})();