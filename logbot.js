#!/usr/bin/env node

var irc = require('irc')
  , util = require('util')
  , path = require('path')
  , format = util.format
  , options = {
      nick: 'logbot'
    , server: 'irc.tripadvisor.com'
    , channels: ['#social']
    , log_url: 'http://irc.tripadvisor.com/logs/'
    , logdir: '/var/www/irc-logs/'
    }
  , client = new irc.Client(options.server, options.nick, {
      channels: options.channels
    , secure: false
    })
  , fs = require('fs')
  ;

function strip(str) {
  return str.replace(/^\s+|\s+$/, '');
}

function log(channel, message) {
  var filename = path.join(options.logdir, '%s-%s-%s-%s.txt')
    , now = new Date()
    , out
    ;

  filename = format(filename, channel.substring(1), now.getFullYear(), now.getMonth()+1, now.getDate());

  out = fs.createWriteStream(filename, {
    flags     : 'a'
  , encoding  : 'utf8'
  , mode      : 0666
  });
  out.write(format('%s: %s\n', now.toTimeString(), message));
}

client.addListener('error', function(message) {
  console.log(message);
});

client.addListener('message', function(from, to, message) {
  var isChannel = ~(to.indexOf('#'))
    , target = isChannel ? to : from
    , response = false
    ;

  if (isChannel) {
    log(target, format('<%s> %s', from, message));

    if (~message.indexOf(options.nick + ':')) {
      var content = strip(message.substring(options.nick.length + 2));
      switch (content) {
        case 'logs':
          response = format('%s: %s', from, options.log_url);
          break;
      }
      if (response) {
        client.say(target, response);
        log(target, format('<%s> %s', options.nick, response));
      }
    }
  }
});

client.addListener('join', function(channel, who) {
  log(channel, format('%s joined.', who));
});

client.addListener('part', function(channel, who, why) {
  log(channel, format('%s left (%s).', who, why));
});

client.addListener('kick', function(channel, who, by, why) {
  log(channel, format('%s was kicked by %s (%s).', who, by, why));
});

client.addListener('topic', function(channel, topic, who) {
  log(channel, format('Topic is "%s" (set by %s)', topic, who));
});
