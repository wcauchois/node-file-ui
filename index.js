var express = require('express'),
    fs = require('fs'),
    util = require('util');

var app = express();

app.use(express.static('public'));

var PORT = 3000;
app.listen(PORT);
util.log("Listening on port " + PORT);


