#!/usr/bin/env node

var irc = require('irc')
  , client = new irc.Client('irc.tripadvisor.com', 'logbot', {
      channels: ['#social']
    })
  ;

client.addListener('message', function(from, to, message) {
  console.log('[' + from + '] ' + to + ': ' + message);
});
