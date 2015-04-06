var express = require('express'),
    Promise = require('bluebird'),
    util = require('util'),
    path = require('path'),
    _ = require('lodash'),
    mime = require('mime'),
    minimatch = require('minimatch');

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

function handleDirectory(dirName) {
  return fs.readdirAsync(dirName).map(function (fileName) {
    var fullPath = path.join(dirName, fileName);
    return fs.statAsync(fullPath).then(function(stats) {
      return _.extend(stats, {fileName: fileName, fullPath: fullPath});
    }).caught(function() { return null });
  }).then(function(unfilteredResults) {
    var results = _.filter(unfilteredResults, _.identity); // Remove falsy values
    return {
      type: 'directory',
      files: _.map(results, function(stats, index) {
        return {
          name: stats.fileName,
          fullPath: path.join(dirName, stats.fileName),
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
      parentDir: path.dirname(dirName),
      dirName: dirName
    };
  });
}

var codeFileExtMap = {
  'js': 'javascript',
  'py': 'python',
  'c': 'c',
  'scala': 'scala',
  'json': 'json',
  'jsx': 'jsx',
  'less': 'css',
  'css': 'css'
};

var imageMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/gif'
];

var otherPlainTextGlobs = [
  '.gitignore',
  '.bashrc',
  '*.txt'
];

function handleFile(fileName) {
  return Promise.try(function() {
    var baseName = path.basename(fileName);
    var file = {
      type: 'other',
      fullPath: fileName,
      fileName: baseName,
      parentDir: path.dirname(fileName)
    };
    var shouldReturnContents = false;
    var extension = path.extname(fileName).substring(1); // Extension without the dot.
    var isOtherPlainTextFile = _.any(otherPlainTextGlobs, function(glob) {
      return minimatch(baseName, glob);
    });
    var mimeType = mime.lookup(fileName);

    if (_.has(codeFileExtMap, extension) || isOtherPlainTextFile) {
      file['type'] = 'text';
      file['highlightClass'] = codeFileExtMap[extension];
      shouldReturnContents = true;
    } else if (_.contains(imageMimeTypes, mimeType)) {
      file['type'] = 'image';
    } else if (extension === 'md') {
      file['type'] = 'markdown';
      shouldReturnContents = true;
    }

    if (shouldReturnContents) {
      return fs.readFileAsync(fileName, 'utf-8').then(function(contents) {
        return _.extend(file, {fileContents: contents});
      });
    } else {
      return file;
    }
  });
}

app.get('/resolve.json', function(req, res) {
  var pathArg = req.query.path;
  fs.statAsync(pathArg).then(function(stats) {
    if (stats.isDirectory()) {
      return handleDirectory(pathArg);
    } else {
      return handleFile(pathArg);
    }
  }).then(function(result) {
    res.json(result);
  }).caught(function(err) {
    res.status(500).json({"message": err.message});
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
    res.set('Content-Type', mimeType || 'application/octet-stream');
  }
  stream.pipe(res);
});

app.use(express.static('public'));

var PORT = 3000;
app.listen(PORT);
util.log("Listening on port " + PORT);

