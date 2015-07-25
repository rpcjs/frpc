'use strict';

var Server = require('../lib/server');
var server = new Server({
  target: window.parent
});

$(function() {
  server.addMethod('getInputValue', function(cb) {
    cb($('input').val());
  });
});
