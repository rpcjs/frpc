'use strict';

var proxyquire = require('proxyquireify')(require);
var stubs = {
  'frame-message': function() {

  }
};
var Server = proxyquire('../lib/server', stubs);

describe('Server', function() {

});
