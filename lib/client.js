'use strict';

var FrameMessage = require('frame-message');
var CallbackStore = require('callback-store');
var StateEmitter = require('state-emitter');

function Client(opts) {
  opts = opts || {};

  this._frameMessage = new FrameMessage(opts);
  this._callbackStore = new CallbackStore();
  this.methods = {};
  this._stateEmitter = new StateEmitter();

  var _this = this;
  this._frameMessage.recieve(function(params) {
    if (params.type === 'ready') {
      _this._tryConnect();
      return;
    }
    if (params.type !== 'response') {
      return;
    }
    var cb = _this._callbackStore.get(params.cid);
    if (cb) {
      cb.apply({}, params.args);
    }
  });

  this._tryConnect();
}

Client.prototype._tryConnect = function() {
  var _this = this;

  function cb(err, methodList) {
    if (err) {
      return;
    }
    _this.register(methodList);
    _this._stateEmitter.emit('connect');
  }

  this._frameMessage.post({
    methodName: 'connect',
    type: 'call',
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
  } else {
    cb = function() {};
  }

  var _this = this;
  this._stateEmitter.once('connect', function() {
    _this._frameMessage.post({
      methodName: methodName,
      type: 'call',
      cid: _this._callbackStore.add(cb),
      args: args
    });
  });
};

Client.prototype.register = function(methods) {
  if (!(methods instanceof Array)) {
    methods = [methods];
  }
  methods.forEach(function(method) {
    if (typeof this.methods[method] === 'undefined') {
      this.methods[method] = function() {
        var args = [method].concat(Array.prototype.slice.call(arguments));
        this.call.apply(this, args);
      }.bind(this);
    }
  }.bind(this));
};

module.exports = Client;
