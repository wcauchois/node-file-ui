var express = require('express'),
    Promise = require('bluebird'),
    util = require('util'),
    path = require('path'),
    _ = require('lodash'),
    mime = require('mime');

var fs = Promise.promisifyAll(require('fs'));

var app = express();

var statTypeMap = {
  'isSymbolicLink': 'symbolicLink',
  'isFile': 'file',
  'isDirectory': 'directory',
  'isBlockDevice': 'blockDevice',
  'isCharacterDevice': 'characterDevice',
  'isFIFO': 'pipe',
  'isSocket': 'socket'
};

app.get('/files.json', function(req, res) {
  fs.readdirAsync(req.query.dir).map(function (fileName) {
    var fullPath = path.join(req.query.dir, fileName);
    return fs.statAsync(fullPath).then(function(stats) {
      return _.extend(stats, {fileName: fileName, fullPath: fullPath});
    }).caught(function() { return null });
  }).then(function(unfilteredResults) {
    var results = _.filter(unfilteredResults, _.identity); // Remove falsy values
    res.json({
      files: _.map(results, function(stats, index) {
        return {
          name: stats.fileName,
          fullPath: path.join(req.query.dir, stats.fileName),
          'type': (_.reduce(statTypeMap, function(currentType, type, funcName) {
            if (typeof currentType === 'undefined' && stats[funcName].bind(stats)()) {
              return type;
            } else {
              return currentType;
            }
          }, undefined) || 'other'),
          rawSize: stats.size,
          index: index
        };
      }),
      parentDir: path.dirname(req.query.dir)
    }).end();
  }, function(err) {
    if (err.code === 'ENOTDIR') {
      res.status(400).json({"message": "Target is a directory"});
    } else {
      res.status(500).json({"message": err.message});
    }
  });
});

app.get(/raw\/(.*)/, function(req, res) {
  var filePath = '/' + req.params[0];
  var stream = fs.createReadStream(filePath);
  stream.on('error', function(err) {
    res.status(400).end(err.message);
  });
  if (req.query.plain === 'true') {
    res.set('Content-Type', 'text/plain');
  } else {
    var mimeType = mime.lookup(filePath);
    if (mimeType) {
      res.set('Content-Type', mimeType);
    }
  }
  stream.pipe(res);
});

app.use(express.static('public'));

var PORT = 3000;
app.listen(PORT);
util.log("Listening on port " + PORT);

