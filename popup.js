(function () {
  var settings = {};
  var pathPerGetbackId = [];

  var init = function () {
    getActiveTab(function (tab) {
      generateResults(tab.id);
    });
  };

  var showMessage = function (string) {
    var el = $('.message');
    el.text(string);
    el.toggle();
    setTimeout(function () {
      el.toggle();
    }, 2000);
  };

  var getSettings = function (tabId, cbContinue) {
    chrome.runtime.sendMessage(
      { cmd: 'settings.get', data: { tabId: tabId } },
      function (response) {
        console.log(response);
        settings = response;
        if (cbContinue) cbContinue();
      }
    );
  };

  var setSetting = function (key, value, tabId) {
    chrome.runtime.sendMessage({
      cmd: 'settings.set',
      data: {
        key: key,
        value: value,
        tabId: tabId,
      },
    });
  };

  var initSettings = function (settings) {
    for (var key in settings) {
      var id = '#input-' + key;
      if (typeof settings[key] === 'boolean') {
        $(id).prop('checked', settings[key]);
      } else if (typeof settings[key] === 'string') {
        $(id).val(settings[key]);
      }
    }
  };

  var initUI = function (tabId) {
    var shopId = null;

    $('input[type=checkbox').change(function (e) {
      if (this.id.indexOf('input-') !== 0) return;
      var key = this.id.replace('input-', '');
      setSetting(key, this.checked, tabId);
      showMessage('Saved');
    });

    document.querySelector('#input-network').addEventListener('change', function(e){
      if (this.checked){
        // Sovendus is active
        document.querySelector('#logo').src = '/images/logo-sovendus.svg';
      }else {
        // adfocus is active
        document.querySelector('#logo').src = '/images/logo-adfocus.png';
      }
    })

    $('input[type=text]').keyup(function (e) {
      if (this.id.indexOf('input-') !== 0) return;
      var key = this.id.replace('input-', '');
      setSetting(key, this.value.trim(), tabId);
    });

    $('#save').on('click', function (e) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    });
  };

  var getQueryParam = function (url, param) {
    var url = new URL(url);
    var urlParams = new URLSearchParams(url.search);
    return urlParams.get(param);
  };

  var showNoInfo = function () {
    $('#section-content').html(
      '<div class="no-info">Sorry, no adfocus TAGs found.<br> Please load a URL to gather information on your path.</div>'
    );
    $('.footer').hide();
  };

  var processPath = function (path) {
    identifyGetbackMainScript(path);
    var templatePaths = [];

    var compareArray = [];

    path.forEach(function (p, index, object) {
      for (getbackId in pathPerGetbackId) {
        if (p.url.indexOf(getbackId) > -1) {
          pathPerGetbackId[getbackId].push(p);
          compareArray.push(p);
        }
      }
    });

    templatePaths = path.filter(function (val) {
      return compareArray.indexOf(val) == -1;
    });

    for (getbackId in pathPerGetbackId) {
      addDetailItem(getbackId, pathPerGetbackId[getbackId], true);
    }

    if (templatePaths.length > 0) {
      addDetailItem('Template Files', templatePaths, false);
    }
  };

  var identifyGetbackMainScript = function (path) {
    var regexMainScript = RegExp('^https://www.getback.ch/([^/]*)$');
    var regexMainScriptOld = RegExp('^https://www.getback.ch/app/tracking/([^/]*)$');

    path.forEach(function (path) {
      if (regexMainScript.test(path.url)) {
        var result = path.url.match(regexMainScript);
        var getbackId = result[1];
        pathPerGetbackId[getbackId] = [];
      }
      if (regexMainScriptOld.test(path.url)) {
        var result = path.url.match(regexMainScriptOld);
        var getbackId = result[1];
        pathPerGetbackId[getbackId] = [];
      }
    });
  };

  var getActiveTab = function (callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      var tab = tabs[0];

      if (tab) {
        callback(tab);
      } else {
        chrome.tabs.get(activeTabId, function (tab) {
          if (tab) {
            callback(tab);
          } else {
            console.log('No active tab identified.');
          }
        });
      }
    });
  };


  var generateResults = function (tabId, expanded) {
    initUI(tabId);
    getSettings(tabId, function () {
      getActiveTab(function (tab) {
        shopId = getQueryParam(tab.url, 'gb_shop');

        if (shopId) {
          setSetting('getback-id', shopId, tab.id);
          settings['getback-id'] = shopId;
        }

        document.querySelector('#logo').src = settings['network'] ? '/images/logo-sovendus.svg' : '/images/logo-adfocus.png';

        initSettings(settings);
        if (!settings['enable-analyzer']) return;
        chrome.runtime.sendMessage(
          {
            cmd: 'ui.getTabData',
            data: { tabId: tabId },
          },
          function (data) {
            if ($.isEmptyObject(data)) {
              showNoInfo();
              return;
            }
            processPath(data.log);
            initClickEvents();
          }
        );
      });
    });
  };

  var createTemplateComponent = function (headerData, detailData, hasId) {
    const template = `
		<div class="detail-item-header">
			<img class="chevron" src="/images/chevron-down.svg" alt"" width="24" height="24"/>
			<div class="detail-item-open d-inline-block">
				<div class="detail-item-status image-working"></div>
				<div class="main-text">
					<div>
						${hasId ? 'Getback Script Tag' : 'Template Files'}<br>
						<div class="detail-item-id">
							${hasId ? headerData : ''}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="detail-item-body hidden">
			${detailData}
		</div>
		`;

    return template;
  };

  var addDetailItem = function (getbackId, pathData, hasId) {
    var detailData = '';
    pathData.forEach(function (path) {
      detailData += `<div class="item mb-2">
			<div class="status-code">${path.web.statusCode}</div> ${
        path.web.fromCache ? '<div class="cache">cache</div>' : ''
      } -
			${path.url}
			</div>`;
    });

    let template = createTemplateComponent(getbackId, detailData, hasId);

    $('#section-content').append(template);
  };

  var initClickEvents = function () {
    $('.detail-item-header').on('click', function (e) {
      $(this).next('.detail-item-body').toggleClass('hidden');
      $(this).toggleClass('active');
    });
  };

  return {
    init: init,
  };
})().init();
