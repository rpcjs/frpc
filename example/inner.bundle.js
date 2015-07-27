'use strict';

var Server = require('../lib/server');
var server = new Server({
  targets: [{
    window: window.parent
  }]
});

$(function() {
  /* the timeout is just for testing the server/client connection */
  setTimeout(function() {
    server.addMethod('getInputValue', function(cb) {
      cb($('input').val());
    });
  }, 4000);
});
