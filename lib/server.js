'use strict';

var StateEmitter = require('state-emitter');
var FrameMessage = require('frame-message');

function Server(opts) {
  opts = opts || {};

  this._stateEmitter = new StateEmitter();
  this._frameMessage = new FrameMessage(opts);
  this._methods = {};

  var _this = this;
  this._frameMessage.recieve(function(params) {
    if (params.type !== 'call') {
      return;
    }
    _this._call(params);
  });

  this.addMethod('connect', function(cb) {
    _this._stateEmitter.once('ready', function() {
      cb(null, _this._methods);
    });
  });

  _this._stateEmitter.once('ready', function() {
    _this._frameMessage.post({
      type: 'ready'
    });
  });
}

Server.prototype._call = function(event) {
  if (!this._methods[event.methodName]) {
    return;
  }
  var _this = this;
  var cb = function() {
    var msg = {
      type: 'response',
      cid: event.cid,
      args: Array.prototype.slice.call(arguments)
    };
    this._frameMessage.post(msg);
  }.bind(this);
  var newArgs = event.args.concat([cb]);
  this._methods[event.methodName].apply({}, newArgs);
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

Server.prototype.start = function() {
  this._stateEmitter.emit('ready');
};

module.exports = Server;
