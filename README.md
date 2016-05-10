## Parse Server Azure Config 

A package to simplify configuration of parse server on azure managed services.

Exports an object with default configurations for storage, push, server, and dashboard.
```js
let config = require('parse-server-azure-config');
let ParseServer = require('parse-server').ParseServer;
let ParseDashboard = require('parse-dashboard');
let express = require('express');

let options = {
  defaults: 'config.js', // file to load with default user configuration
  secrets: 'secrets.js'  // file to load secrets
}

let {
  server,     // parse server configuration options
  storage,    // parse server azure storage configuration options
  push,       // parse server azure push configuration options
  dashboard   // parse dashboard configuration options
} = config(__dirname, options);

let app = express();
app.use('/parse', new ParseServer(server));
app.use('/parse-dashboard', ParseDashboard(dashboard));

app.listen(process.env.PORT);
```