#!/usr/bin/env node

var fs = require('fs');
var toc = require('./index.js');
var utils = require('./lib/utils');
var args = utils.minimist(process.argv.slice(2), {
  boolean: ['i', 'json', 'firsth1', 'stripHeadingTags'],
  string: ['append', 'bullets'],
  default: {
    firsth1: true,
    stripHeadingTags: true
  }
});

if (args._.length !== 1) {
  console.error([
    'Usage: markdown-toc [options] <input> ',
    '',
    '  input:        The Markdown file to parse for table of contents,',
    '                or "-" to read from stdin.',
    '',
    '  -i:           Edit the <input> file directly, injecting the TOC at <!-- toc -->',
    '                (Without this flag, the default is to print the TOC to stdout.)',
    '',
    '  --json:       Print the TOC in JSON format',
    '',
    '  --append:     Append a string to the end of the TOC',
    '',
    '  --bullets:    Bullets to use for items in the generated TOC',
    '                (Supports multiple bullets: --bullets "*" --bullets "-" --bullets "+")',
    '                (Default is "*".)',
    '',
    '  --maxdepth:   Use headings whose depth is at most maxdepth',
    '                (Default is 6.)',
    '',
    '  --no-firsth1: Include the first h1-level heading in a file',
    '',
    '  --no-stripHeadingTags: Do not strip extraneous HTML tags from heading',
    '                         text before slugifying'
  ].join('\n'));
  process.exit(1);
}

if (args.i && args.json) {
  console.error('markdown-toc: you cannot use both --json and -i');
  process.exit(1);
}

if (args.i && args._[0] === '-') {
  console.error('markdown-toc: you cannot use -i with "-" (stdin) for input');
  process.exit(1);
}

var input = process.stdin;
if (args._[0] !== '-') input = fs.createReadStream(args._[0]);

input.pipe(utils.concat(function(input) {
  if (args.i) {
    var newMarkdown = toc.insert(input.toString(), args);
    fs.writeFileSync(args._[0], newMarkdown);
  } else {
    var parsed = toc(input.toString(), args);
    output(parsed);
  }
}));

input.on('error', function onErr(err) {
  console.error(err);
  process.exit(1);
});

function output(parsed) {
  if (args.json) return console.log(JSON.stringify(parsed.json, null, '  '));
  process.stdout.write(parsed.content);
}
