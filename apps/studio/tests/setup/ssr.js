// import util from 'util'
// const util = require('util')
// window.TestEncoder = new util.TextEncoder('utf-8');
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });