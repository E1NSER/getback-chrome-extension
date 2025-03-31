var settings = {};

var getSettings = function (cbContinue) {
  chrome.runtime.sendMessage({ cmd: 'settings.get' }, function (data) {
    settings = data;
    if (cbContinue) cbContinue();
  });
};

jQuery(document).ready(function () {
  getSettings(function () {
    if (
      settings['inject-script'] &&
      settings['getback-id'] !== '' &&
      settings['getback-id'] !== undefined
    ) {

      var baseUrl = '';

      console.log('Inject Getback Script');
      baseUrl = settings['network'] ? 'https://www.sovopt.com/' : 'https://www.getback.ch/';

      if (settings['dev']){
        baseUrl = baseUrl.replace('www', 'www-dev');
      }

      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = baseUrl + settings['getback-id'];
      console.log(s);
 
      setTimeout(function(){
        document.body.appendChild(s);
        console.log(`Getback loaded with deplay of: ${parseInt(settings.delay)}ms`)
      }, parseInt(settings.delay));
    }
  });
});
