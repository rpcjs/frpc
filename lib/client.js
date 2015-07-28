'use strict';

var bind = require('bind-ponyfill');
var Publisher = require('frame-message').Publisher;
var Subscriber = require('frame-message').Subscriber;
var CallbackStore = require('callback-store');
var StateEmitter = require('state-emitter');

function Client(opts) {
  opts = opts || {};

  this._subscriber = new Subscriber(opts);
  this._publisher = new Publisher(opts);
  this._callbackStore = new CallbackStore();
  this.methods = {};
  this._stateEmitter = new StateEmitter();

  this._listen();
  this._tryConnect();
}

Client.prototype._listen = function() {
  var handlers = (function(client) {
    return {
      ready: function() {
        client._tryConnect();
      },
      newMethod: function(params) {
        client.register(params);
      },
      response: function(params) {
        var cb = client._callbackStore.get(params.cid);
        if (cb) {
          cb.apply({}, params.args);
        }
      }
    };
  })(this);

  this._subscriber.subscribe(function(type, params) {
    var handler = handlers[type] || function() {};
    handler(params);
  });
};

Client.prototype._tryConnect = function() {
  var cb = bind(function(err, methodList) {
    if (err) {
      return;
    }
    this.register(methodList);
    this._stateEmitter.emit('connect');
  }, this);

  this._publisher.publish('call', {
    methodName: 'connect',
    cid: this._callbackStore.add(cb),
    args: []
  });
};

/**
 * @callback requestCallback
 * @param {Error} error - The error that happened during executing
 *   the remote method.
 * @param {..*} resonseData - The data returned by the remote method.
 */
/**
 * Call a remote method.
 * @param {string} methodName - The name of the method to be called.
 * @param {...*} arguments - The arguments to be passed to the method.
 * @param {requestCallback} [cb] - The callback that handles the response.
 */
Client.prototype.call = function(methodName) {
  var args = [];
  var i = 0;
  var cb;

  if (!methodName) {
    throw new TypeError('call requires a methodName');
  }
  if (typeof methodName !== 'string') {
    throw new TypeError('call requires a methodName of string type');
  }

  while (typeof arguments[++i] !== 'function' && i < arguments.length) {
    args.push(arguments[i]);
  }

  if (typeof arguments[i] === 'function') {
    cb = arguments[i];
  }

  this._stateEmitter.once('connect', bind(function() {
    this._publisher.publish('call', {
      methodName: methodName,
      cid: cb ? this._callbackStore.add(cb) : undefined,
      args: args
    });
  }, this));
};

Client.prototype.register = function(methods) {
  if (!(methods instanceof Array)) {
    methods = [methods];
  }
  methods.forEach(bind(function(method) {
    if (typeof this.methods[method] === 'undefined') {
      this.methods[method] = bind(function() {
        var args = [method].concat(Array.prototype.slice.call(arguments));
        this.call.apply(this, args);
      }, this);
    }
  }, this));
};

module.exports = Client;
