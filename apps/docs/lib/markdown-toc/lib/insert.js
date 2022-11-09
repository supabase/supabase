'use strict';

var toc = require('..');
var utils = require('./utils');

/**
 * The basic idea:
 *
 *  1. when front-matter exists, we need to avoid turning its properties into headings.
 *  2. We need to detect toc markers on the page. For now it's a simple HTML code comment
 *     to ensure the markdown is compatible with any parser.
 *
 * @param  {String} `str` Pass a string of markdown
 * @param  {Object} `options` Pass options to toc generation
 * @return {String} Get the same string back with a TOC inserted
 */

module.exports = function insert(str, options) {
  options = options || {};

  var regex = options.regex || /(?:<!-- toc(?:\s*stop)? -->)/g;
  var open = typeof options.open === 'string' ? options.open : '<!-- toc -->\n\n';
  var close = typeof options.close === 'string' ? options.close : '<!-- tocstop -->';
  var obj;

  var newlines = '';
  var m = /\n+$/.exec(str);
  if (m) newlines = m[0];

  // does the file have front-matter?
  if (/^---/.test(str)) {
    // extract it temporarily so the syntax
    // doesn't get mistaken for a heading
    obj = utils.matter(str);
    str = obj.content;
  }

  var sections = split(str, regex);
  if (sections.length > 3) {
    throw new Error('markdown-toc only supports one Table of Contents per file.');
  }

  var last = sections[sections.length - 1];
  if (sections.length === 3) {
    sections.splice(1, 1, open + (options.toc || toc(last, options).content));
    sections.splice(2, 0, close);
  }

  if (sections.length === 2) {
    sections.splice(1, 0, open + toc(last, options).content + '\n\n' + close);
  }

  var resultString = sections.join('\n\n') + newlines;
  // if front-matter was found, put it back now
  if (obj) {
    return utils.matter.stringify(resultString, obj.data);
  }
  return resultString;
};

function split(str, re) {
  return str.split(re).map(trim);
}

function trim(str) {
  return str.trim();
}
