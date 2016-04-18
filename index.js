var express = require('express');
var AzurePushAdapter = require('parse-server-azure-push');
var AzureStorageAdapter = require('parse-server-azure-storage').AzureStorageAdapter;
var ParseServer = require('parse-server').ParseServer;
var merge = require('deeply');

module.exports = fromUser => {
  fromUser = fromUser || {}
  var config = {};
  var fromFile = {};
  var mountPath = '/parse';

  var defaults = {
    databaseURI: 'mongodb://localhost:27017/dev',
    serverURL: 'http://localhost:1337' + mountPath,
    storage: {
      container: 'parse',
      adapter: AzureStorageAdapter,
      directAccess: true
    },
    filesAdapter: _ => new config.storage.adapter(config.storage.name, config.storage.container, config.storage),
    push: { 
      adapter: AzurePushAdapter 
    },
    allowClientClassCreation: false,
    enableAnonymousUsers: false
  }

  var fromEnvironment = {
    appId: process.env.APP_ID,
    masterKEY: process.env.MASTER_KEY,
    databaseURI: process.env.DATABASE_URI,
    serverURL: process.env.SERVER_URL + mountPath,
    storage: {
      name: process.env.STORAGE_NAME,
      container: process.env.STORAGE_CONTAINER,
      accessKey: process.env.STORAGE_KEY,
      directAccess: process.env.STORAGE_DIRECTACCESS
    }
    allowClientClassCreation: process.env.ALLOW_CLIENT_CLASS_CREATION,
    enableAnonymousUsers: process.env.ENABLE_ANONYMOUS_USERS,
  }

  if (fromUser.configurationFile) {
    try {
      fromFile = require(fromUser.configurationFile);
    } catch (e) {
      console.error(e);
    }
  }

  Object.assign(config, merge(defaults, fromFile, fromUser, fromEnvironment));
  console.log(config);

  var app = express();
  app.use(mountPath, new ParseServer(config));
  return app;
}

