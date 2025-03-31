var App = (function () {
  var defaultSettings = {
    'inject-script': false,
    'enable-analyzer': false,
    'network': false,
    'dev': false,
    'delay': 0
  };

  var settings = {};

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg == 'getRequests') {
      sendResponse(getbackRequests);
    }
  });

  var init = function () {
    initSettings(function () {
      initMessaging();
      clearLogOnReload();
      initWebRequestsObserver();
      clearStorage();
    });
  };

  var initSettings = function (cbContinue) {
    chrome.storage.local.get('settings', function (data) {
      console.log('Init Settings');
      if (data.settings) settings = data.settings;
      settings = settings;
      if (cbContinue) cbContinue();
    });
  };

  var initMessaging = function () {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      var cmd = request.cmd;
      var data = request.data;
      switch (cmd) {
        case 'settings.set':
          initSettings(function () {
            if (!settings[data.tabId]) {
              settings[data.tabId] = {};
            }
            settings[data.tabId][data.key] = data.value;
            chrome.storage.local.set({ settings: settings });
          });
          break;
        case 'settings.get':
          console.log('Get settings');
          if (!request.data) {
            var data = { tabId: '' };
            data.tabId = sender.tab.id;
          }

          chrome.storage.local.get('settings', function (result) {
            if (!result.settings[data.tabId]) {
              result.settings[data.tabId] = defaultSettings;
            }
            sendResponse(result.settings[data.tabId]);
          });
          return true;

          break;
        case 'ui.getTabData':
          var log = Tracer.getLog(data.tabId);
          sendResponse({
            log: log,
          });
          break;
        case 'ui.updateBadgeCount':
          var log = Tracer.getLog(tabId);
        default:
          break;
      }
    });
  };

  var initWebRequestsObserver = function () {
    var opts = ['responseHeaders'];
    var filter = { urls: ['https://*.getback.ch/*'] };
    var cbProcessDetails = function (details) {
    
      var timeNow = new Date().getTime();
      var log = Tracer.getLog(details.tabId);

      // Clear Log after 3 Seconds
      // if (log && log[0].timestamp) {
      // 	//
      // 	console.log('Clear log entries');
      // 	if ((timeNow - log[0].timestamp) / 1000 > 3) {
      // 		Tracer.clearTabInfo(details.tabId);
      // 	}
      // }
      if (!settings[details.tabId]) return;
      if (!settings[details.tabId]['enable-analyzer']) return;

      if (details.tabId < 0) return;

      Tracer.addWebRequestInfo(details.tabId, details);

      updateBadge(details.tabId);

      if (rand(1, 100) <= 30) {
        console.log('RANDOM GC STARTED');
        garbageCollect();
      }
    };
    chrome.webRequest.onCompleted.addListener(cbProcessDetails, filter, opts);
    chrome.webRequest.onBeforeRequest.addListener(function(details){
      if(settings[details.tabId]["dev"]){
        return {cancel: true};
      }
    }, {urls: ['https://www.getback.ch/*']}, ['blocking']);
  };

  var garbageCollect = function () {
    chrome.windows.getAll({ populate: true }, function (windows) {
      var visibleTabs = [];

      for (var i = 0; i < windows.length; i++) {
        var windowscan = windows[i];

        for (var ii = 0; ii < windowscan.tabs.length; ii++) {
          var tab = windowscan.tabs[ii];
          visibleTabs.push(tab.id.toString());
        }
      }

      var stamp = new Date().getTime();
      var logs = Tracer.getLogs();

      for (var tabId in logs) {
        var age = stamp - logs[tabId].lastactive;

        if (visibleTabs.indexOf(tabId) == -1 && age > 30000) {
          // 30 seconds
          delete logs[tabId];

          console.log('GC: tab ' + tabId + ' wasnt visible and is stale, so was freed', this.tabs);
        }
      }
    });
  };

  // Delete log entries from storage after closing the tab.
  var clearStorage = function () {
    chrome.tabs.onRemoved.addListener(function (tabId) {
      var logs = Tracer.getLogs();
      settings[tabId] && delete settings[tabId];
      chrome.storage.local.set({ settings: settings });
      delete logs[tabId];
      chrome.storage.local.get('settings', function (result) {
        delete result.settings[tabId];
      });
    });
  };

  var clearLogOnReload = function () {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
      if (changeInfo.status === 'loading') {
        var logs = Tracer.getLogs();
        if (logs[tabId]) {
          Tracer.clearTabInfo(tabId);
        }
      }
    });
  };

  var updateBadge = function (tabId) {
    if (!settings[tabId]['enable-analyzer']) return;
    var log = Tracer.getLog(tabId);
    if (!log) return;
    chrome.browserAction.setBadgeText({
      text: log.length.toString(),
      tabId: tabId,
    });
  };

  var rand = function (min, max) {
    return Math.random() * (max - min) + min;
  };

  return {
    init: init,
  };
})();
