'use strict';

var foso = require('foso');
var html = require('fosify-html');
var js = require('fosify-js');

foso
  .please({
    serve: true,
    watch: true,
    livereload: true
  })
  .fosify(js)
  .fosify(html)
  .now();
