(function () {
  var settings = {},
    shopId;

  var showMessage = function (string) {
    var el = document.querySelector(".message");
    el.textContent = string;
    el.style.display = "block";
    setTimeout(() => el.style.display = "none", 2000);
  };

  var getSettings = function (tabId, cbContinue) {
    chrome.runtime.sendMessage({ cmd: "settings.get", data: { tabId: tabId } }, function (response) {
      settings = response || {}; // Only the settings for this tab
      if (!settings["getback-id"] && shopId) {
        settings["getback-id"] = shopId;
        setSetting("getback-id", shopId, tabId);
      }
      console.log("Settings loaded for tab", tabId, settings);
      if (cbContinue) cbContinue();
    });
  };

  var setSetting = function (key, value, tabId) {
    chrome.runtime.sendMessage(
      {
        cmd: "settings.set",
        data: { key: key, value: value, tabId: tabId },
      },
      () => {
        console.log(`Saved setting: ${key} = ${value}`);
      }
    );
  };

  var initSettings = function () {
    console.log("Initializing UI with settings:", settings);
    for (let key in settings) {
      let id = "#input-" + key;
      let element = document.querySelector(id);
      if (!element) continue;
      
      if (typeof settings[key] === "boolean") {
        element.checked = settings[key];
      } else if (typeof settings[key] === "string") {
        element.value = settings[key];
      }
    }
  };

  var initUI = function (tabId) {
    console.log("init ui");
    document.querySelectorAll("input[type=checkbox]").forEach(checkbox => {
      checkbox.addEventListener("change", function () {
        let key = this.id.replace("input-", "");
        setSetting(key, this.checked, tabId);
        showMessage("Saved");
      });
    });

    const networkCheckbox = document.getElementById("input-network");
    if (networkCheckbox) {
      networkCheckbox.addEventListener("change", function () {
        document.getElementById("logo").src = this.checked ? "/images/logo-sovendus.svg" : "/images/logo-adfocus.png";
      });
    }

    document.querySelectorAll("input[type=text]").forEach(input => {
      input.addEventListener("input", function () {
        let key = this.id.replace("input-", "");
        setSetting(key, this.value.trim(), tabId);
      });
    });

    const saveButton = document.getElementById("save");
    if (saveButton) {
      saveButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.reload(tabs[0].id);
        });
      });
    }
  };

  var getActiveTab = function (callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
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
    console.log("active tab:", tab);
    shopId = getQueryParam(tab.url, "gb_shop");
    generateResults(tab.id);
  });
})();
