'use strict';

var bind = require('bind-ponyfill');
var StateEmitter = require('state-emitter');
var Publisher = require('frame-message').Publisher;
var Subscriber = require('frame-message').Subscriber;

function Server(opts) {
  opts = opts || {};

  this._stateEmitter = new StateEmitter();
  this._publisher = new Publisher(opts);
  this._subscriber = new Subscriber(opts);
  this._methods = {};

  this._subscriber.subscribe(bind(function(type, params) {
    if (type !== 'call') {
      return;
    }
    this._call(params);
  }, this));

  this.addMethod('connect', bind(function(cb) {
    cb(null, this._methods);
  }, this));

  this._publisher.publish('ready');
}

Server.prototype._call = function(params) {
  if (!params) {
    throw new Error('params is required');
  }

  this._stateEmitter.once(params.methodName + 'Ready', bind(function(method) {
    var cb = this._createCallback(params.cid);
    var args = params.args.concat([cb]);
    method.apply({}, args);
  }, this));
};

Server.prototype._createCallback = function(cid) {
  if (cid) {
    return function() {
      var msg = {
        cid: cid,
        args: Array.prototype.slice.call(arguments)
      };
      this._publisher.publish('response', msg);
    }.bind(this);
  }
  return function() {};
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

  this._publisher.publish('newMethod', methodName);
  this._stateEmitter.emit(methodName + 'Ready', method);
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
