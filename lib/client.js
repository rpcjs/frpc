'use strict';

var FrameMessage = require('frame-message');

var createPublicMethodName = require('./create-method-name');
var ServerError = require('./server-error');
var debug = require('debug')('bograch');

var CallbackStore = require('callback-store');

var DEFAULT_TTL = 5 * 1000; // 5 sec.

function Client(opts) {
  opts = opts || {};

  this._frameMessage = new FrameMessage(opts);
  this._callbackStore = new CallbackStore();
  this.methods = {};

  var _this = this;
  this._frameMessage.recieve(function(params) {
    if (params.type !== 'response') {
      return;
    }
    var cb = _this._callbackStore(params.cid);
    if (cb) {
      cb.apply({}, params.args);
    }
  });
}

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
    throw new TypeError('Bograch.call requires a methodName');
  }
  if (typeof methodName !== 'string') {
    throw new TypeError('Bograch.call requires a methodName of string type');
  }

  while (typeof arguments[++i] !== 'function' && i < arguments.length) {
    args.push(arguments[i]);
  }

  if (typeof arguments[i] === 'function') {
    cb = arguments[i];
  } else {
    cb = function() {};
  }

  this._frameMessage.post({
    methodName: methodName,
    type: 'call',
    cid: this._callbackStore.add(cb),
    args: args
  });
};

Client.prototype.register = function(methods) {
  if (!(methods instanceof Array)) {
    methods = [methods];
  }
  methods.forEach(function (method) {
    if (typeof this.methods[method] === 'undefined') {
      this.methods[method] = function () {
        var args = [method].concat(Array.prototype.slice.call(arguments));
        this.call.apply(this, args);
      }.bind(this);
    }
  }.bind(this));
};

module.exports = Client;
