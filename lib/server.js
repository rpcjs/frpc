'use strict';

var StateEmitter = require('state-emitter');
var Publisher = require('frame-message').Publisher;
var Subscriber = require('frame-message').Subscriber;

function Server(opts) {
  opts = opts || {};

  this._stateEmitter = new StateEmitter();
  this._publisher = new Publisher(opts);
  this._subscriber = new Subscriber(opts);
  this._methods = {};

  var _this = this;
  this._subscriber.subscribe(function(type, params) {
    if (type !== 'call') {
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
    _this._publisher.publish('ready');
  });
}

Server.prototype._call = function(params) {
  if (!this._methods[params.methodName]) {
    return;
  }
  var _this = this;
  var cb;
  if (params.cid) {
    cb = function() {
      var msg = {
        cid: params.cid,
        args: Array.prototype.slice.call(arguments)
      };
      this._publisher.publish('response', msg);
    }.bind(this);
  } else {
    cb = function() {};
  }
  var newArgs = params.args.concat([cb]);
  this._methods[params.methodName].apply({}, newArgs);
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
