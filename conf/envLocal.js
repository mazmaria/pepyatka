exports.getAppConfig = function () {
  configValues = {
    secret: 'sectet token',
    saltSecret: 'sectet token',
    port: 3000,
    loggerLevel: 'info',
    remoteUser: false
  }

  return configValues;
}

exports.getElasticSearchConfig = function(){
  serverOptions = {
    host: 'localhost',
    port: 9200
  }

  return serverOptions;
}

exports.isAnonymousPermitted = function(){
  var isPermitted = true;

  return isPermitted;
}

exports.getWordWhichEqualHashTag = function(){
  var wordWhichEqualHashTag = 'hashtagsym';

  return wordWhichEqualHashTag;
}

exports.getStatisticsTopCount = function() {
  var topCount = 20

  return topCount
}
