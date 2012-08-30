var irc = require('irc')
  , util = require('util')
  , path = require('path')
  , format = util.format
  , utils = require('./utils')
  , zeropad = utils.zeropad
  , strip = utils.strip
  , fs = require('fs')
  , config = require('../config')
  , client
  ;

config.nick = config.nick || 'logbot';
config.server = config.server || 'irc.example.com';
config.channels = config.channels || ['#test'];
config.log_url = config.log_url || 'http://irc.example.com/logs';
config.log_dir = config.log_dir || '/var/wwww/irc-logs/';

client = new irc.Client(config.server, config.nick, {
    channels: config.channels
  , secure: false
});

if ('/' !== config.log_dir[0]) { config.log_dir = path.join(__dirname, '..', config.log_dir); }

function log(channel, message) {
  var filename = path.join(config.log_dir, '%s-%s-%s-%s.txt')
    , now = new Date()
    , out
    ;

  filename = format(filename,
    channel.substring(1),
    now.getFullYear(),
    zeropad(now.getMonth()+1),
    zeropad(now.getDate())
  );

  out = fs.createWriteStream(filename, {
    flags     : 'a'
  , encoding  : 'utf8'
  , mode      : 0666
  });
  out.write(format('%s: %s\n', now.toTimeString(), message));
  out.destroySoon();
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

    if (~message.indexOf(config.nick + ':')) {
      var content = strip(message.substring(config.nick.length + 2));
      switch (content) {
        case 'logs':
          response = format('%s: %s', from, config.log_url);
          break;
      }
      if (response) {
        client.say(target, response);
        log(target, format('<%s> %s', config.nick, response));
      }
    } else if ('!' === message[0]) {
      var p = message.slice(1).split(' ')
        , cmd = p[0]
        , rest = p.slice(1).join()
        ;

      if ('help' === cmd) {
        if (!rest) {
          response = format('%s: !help !logs', from);
        } else if ('!logs' === rest) {
          response = format('%s: !logs - show the URI where the logs are located', from);
        }
      } else if ('logs' === cmd) {
        response = format('%s: %s', from, config.log_url);
      }
      if (response) {
        client.say(target, response);
        log(target, format('<%s> %s', config.nick, response));
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

module.exports = {};
