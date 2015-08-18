# frpc

RPC between iframes and windows using postMessage

[![Dependency Status](https://david-dm.org/zkochan/frpc/status.svg?style=flat)](https://david-dm.org/zkochan/frpc)
[![Build Status](https://travis-ci.org/zkochan/frpc.svg?branch=master)](https://travis-ci.org/zkochan/frpc)
[![npm version](https://badge.fury.io/js/frpc.svg)](http://badge.fury.io/js/frpc)


## Installation

```
npm install --save frpc
```

## Usage example

Lets say we want to change the height of an iframe. We don't know from the parent window when should the iframe be resized and what should be the size of it, so we have to call a function in the parent and pass the heigh to it.

```js
/* parent window code */
var Server = require('frpc').Server;

var server = new Server({
  channel: 'foo',
  targets: [
    window: targetIframe.contentWindow,
    origin: '*' /* this is default value of origin as well */
  ]
});

server.addMethod('resize', function(newHeight) {
  targetIframe.style.height = newHeight + 'px';
});

/* iframe window code */
var Client = require('frpc').Client;

var client = new Client({
  channel: 'foo',
  targets: [
    window: window.parent
  ]
});

client.register(['resize']);

client.methods.resize(1200);
```


## License

MIT
