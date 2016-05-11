var AzurePushAdapter = require('parse-server-azure-push');
var AzureStorageAdapter = require('parse-server-azure-storage').AzureStorageAdapter;
var DefaultFilesAdapter = require('parse-server/lib/Adapters/Files/FilesAdapter').FilesAdapter;
var DefaultPushAdapter = require('parse-server/lib/Adapters/Push/PushAdapter').PushAdapter;
var util = require('util');

module.exports = (siteRoot, options) => {
  options = options || {};

  var push = {
    HubName: process.env.MS_NotificationHubName || (process.env.WEBSITE_SITE_NAME? process.env.WEBSITE_SITE_NAME + '-hub' : undefined),
    ConnectionString: process.env.CUSTOMCONNSTR_MS_NotificationHubConnectionString
  };

  var storage = {
    name: process.env.STORAGE_NAME,
    container: process.env.STORAGE_CONTAINER || 'parse',
    accessKey: process.env.STORAGE_KEY,
    directAccess: true
  };

  var server = {
    appId: process.env.APP_ID || 'appId',
    masterKey: process.env.MASTER_KEY || 'masterKey',
    databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev',
    serverURL: (process.env.SERVER_URL || 'http://localhost:1337') + '/parse',
    cloud: siteRoot + '/cloud/main.js',
    logFolder: siteRoot + '/logs',
    filesAdapter: () => {
      if (validate('storage', ['name', 'container', 'accessKey']))
        return new AzureStorageAdapter(storage.name, storage.container, storage);
      else {
        return new DefaultFilesAdapter();
      }
    },
    push: { 
      adapter: () => {
        if (validate('push', ['HubName', 'ConnectionString']))
          return AzurePushAdapter(push);
        else {
          return new DefaultPushAdapter();
        } 
      }
    },
    allowClientClassCreation: false,
    enableAnonymousUsers: false
  };

  var dashboard = {
    apps: [
      {
        appId: server.appId,
        serverURL: server.serverURL,
        masterKey: server.masterKey,
        appName: process.env.WEBSITE_SITE_NAME || 'Parse Server Azure'
      }
    ],
    users: [
      {
        user: server.appId,
        pass: server.masterKey
      }
    ]
  };

  loadConfigFile(options.config || 'config.js');
  loadConfigFile(options.local || 'local.js');

  var api = {
    server: server,
    dashboard: dashboard,
    push: push,
    storage: storage
  };

  console.log('parse-server-azure-config generated the following configuration:');
  console.log(util.inspect(api, { showHidden: false, depth: 4 }))

  return api;

  function validate(configName, props) {
    var valid = props.reduce((configValid, prop) => {
      if (!api[configName][prop]) 
        console.log(`Missing required property '${prop}' in ${configName} configuration`);
      return configValid && api[configName][prop];
    }, true);

    if (!valid) 
      console.log(`Will not setup parse-server-azure-${configName} due to invalid configuration`);
    return valid;
  }

  function loadConfigFile(filename) {
    try {
      var config = require(`${siteRoot}/${filename}`);

      Object.assign(server, config.server);
      Object.assign(push, config.push);
      Object.assign(storage, config.storage);

      // concat apps and users
      Object.keys(dashboard).forEach((key) => {
        var val = config && config.dashboard && config.dashboard[key];
        if (val)
          dashboard[key] = dashboard[key].concat(val);
      });
    } catch (err) { 
      console.error(err);
      console.log(`Couldn't load configuration from ${siteRoot}/${filename}`) 
    }
  }
}
