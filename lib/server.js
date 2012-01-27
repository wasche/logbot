var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , fs = require('fs')
  , path = require('path')
  , utils = require('./utils')
  , zeropad = utils.zeropad
  , merge = require('object-merge').merge
  , config = merge({
      pub       : 'public'
    , views     : 'views'
    , log_dir   : 'logs'
    , web_port  : 8001
    , mount     : ''
    }, require('../config'))
  , app = express.createServer()
  ;

if ('/' !== config.pub[0])      { config.pub      = path.join(__dirname, '..', config.pub) }
if ('/' !== config.views[0])    { config.views    = path.join(__dirname, '..', config.views) }
if ('/' !== config.log_dir[0])  { config.log_dir  = path.join(__dirname, '..', config.log_dir) }

app.set('views', config.views);
app.set('view engine', 'jade');

app.dynamicHelpers({
  base: function(){
    return config.mount || '';
  }
, zeropad: function(){
    return zeropad;
  }
, MONTHS: function(){
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec'];
  }
});

app.use(stylus.middleware({
    src: config.views
  , dest: config.pub
  , compile: function(str, path) {
      return stylus(str)
        .set('filename', path)
        .set('compress', false)
        .use(nib())
        .import('nib');
    }
  , force: true
}));
app.use(app.router);
app.use(express.static(config.pub));

app.get('/', function(req, res){
  var channels = {};

  // get list of files in log_dir to build channel list
  fs.readdirSync(config.log_dir).forEach(function(file){
    if (/(.*)-(\d{4})-(\d{1,2})-(\d{2})\.txt/.test(file)) {
      var channel = RegExp.$1;
      channels[channel] || (channels[channel] = 0);
      channels[channel]++;
    }
  });

  res.render('index', {channels: channels});
});

app.get('/logs/:channel.:format?', function(req, res){
  var logs = []
    , channel = req.params.channel
    , format = req.params.format
    ;

  // get list of files in log_dir to build channel list
  fs.readdirSync(config.log_dir).forEach(function(file){
    if (/(.*)-(\d{4})-(\d{1,2})-(\d{2})\.txt/.test(file)) {
      if (RegExp.$1 !== channel) { return }

      var year = parseInt(RegExp.$2, 10)
        , month = parseInt(RegExp.$3, 10)
        , day = parseInt(RegExp.$4, 10)
        , date = new Date(year, month, day)
        ;

      logs[year] || (logs[year] = {});
      logs[year][month] || (logs[year][month] = {});
      logs[year][month][day] || (logs[year][month][day] = {date: date});
    }
  });

  switch (format) {
    case 'json':
      res.send(logs);
      break;
    case 'html':
    default:
      res.render('channel', {channel: channel, logs: logs});
  }
});

app.get('/logs/:channel/:year/:month/:day.:format?', function(req, res){
  var channel = req.params.channel
    , year = req.params.year
    , month = req.params.month
    , day = req.params.day
    , format = req.params.format
    , file = path.join(config.log_dir, [channel, year, month, day].join('-') + '.txt')
    , date = new Date(
        parseInt(year, 10)
      , parseInt(month, 10)
      , parseInt(day, 10)
      )
    , lines
    ;

  lines = fs.readFileSync(file, 'utf8')
          .split(/\n/)
          .map(function(line){
            // 15:45:51 GMT-0500 (EST): <user> test
            return (/^(\d{2}):(\d{2}):(\d{2}) \w+\-\d+ \(\w+\): <(.*)> (.*)$/.test(line) && {
                timestamp: new Date(
                    date.getFullYear()
                  , date.getMonth()
                  , date.getDate()
                  , parseInt(RegExp.$1, 10)
                  , parseInt(RegExp.$2, 10)
                  , parseInt(RegExp.$3, 10)
                  )
              , user: RegExp.$4
              , text: RegExp.$5
            }) || null;
          })
          .filter(function(line){
            return line != null;
          });

  switch (format) {
    case 'json':
      res.send(lines);
      break;
    case 'html':
    default:
      res.render('log', {channel: channel, date: date, lines: lines});
  }
});

app.listen(config.web_port);

module.exports = app;
