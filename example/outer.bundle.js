'use strict';

var Client = require('../lib/client');

$(function() {
  var client = new Client({
    targets: [{
      window: document.getElementById('iframe').contentWindow
    }]
  });
  window.client = client;

  client.register(['getInputValue']);

  $('button').click(function() {
    client.methods.getInputValue(function(value) {
      $('.values').append('<div class="value">' + value + '</div>');
    });
  });
});
