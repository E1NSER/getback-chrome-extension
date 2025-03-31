var Tracer = (function () {
  var log = {};

  var getLog = function (tabId) {
    return log[tabId];
  };

  var getLogs = function () {
    return log;
  };

  var clearTabInfo = function (tabId) {
    delete log[tabId];
  };

  var addWebRequestInfo = function (tabId, details) {
    var hop;
    if (!log[tabId]) log[tabId] = [];

    hop = {
      url: details.url,
      web: details,
      timestamp: new Date().getTime(),
    };
    log[tabId].push(hop);
    log[tabId].lastactive = new Date().getTime();
  };

  // return {
  //   init: init,
  //   addWebRequestInfo: addWebRequestInfo,
  //   addNavigationInfo: addNavigationInfo,
  //   processPageData: processPageData,
  //   addUserClick: addUserClick,
  //   clearTabInfo: clearTabInfo,
  //   getLog: getLog,
  //   //dump: dump
  // };

  return {
    addWebRequestInfo: addWebRequestInfo,
    clearTabInfo: clearTabInfo,
    getLog: getLog,
    getLogs: getLogs,
  };
})();
