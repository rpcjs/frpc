'use strict';

var FrameMessage = require('frame-message');

function Server(opts) {
  opts = opts || {};

  this._frameMessage = new FrameMessage(opts);

  this._methods = {};

  var _this = this;
  this._frameMessage.recieve(function(params) {
    if (params.type !== 'call') {
      return;
    }
    _this._call(params);
  });
}
/*
Server.prototype._init = function() {
  var methodName = createPublicMethodName(this._name, 'methodList');
  this._transport.on(methodName, function(args, cb) {
    cb(null, this._methods);
  }.bind(this));
};*/

Server.prototype._call = function(event) {
  if (!this.methods[event.methodName]) {
    return;
  }
  var _this = this;
  var cb = function() {
    var msg = {
      channel: this._channel + '_response',
      cid: event.cid,
      args: Array.prototype.slice.call(arguments)
    };
    this._target.postMessage(JSON.stringify(msg), this._origin);
  };
  var newArgs = event.args.concat([cb]);
  this.methods[event.methodName].apply({}, newArgs);
};

Server.prototype.addMethod = function(methodName, method) {
  if (!methodName) {
    throw new Error('methodName is required');
  }
  if (typeof methodName !== 'string') {
    throw new Error('methodName has to be a string');
  }
  if (method === null || typeof method !== 'function') {
    throw new Error('method has to be a callback function');
  }

  this._methods[methodName] = method;
};

Server.prototype.addMethods = function(scope) {
  if (typeof scope !== 'object') {
    throw new Error('scope should be an object');
  }

  for (var methodName in scope) {
    this.addMethod(methodName, scope[methodName]);
  }
};

module.exports = Server;
