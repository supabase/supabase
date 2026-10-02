// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// This module ports:
// - https://github.com/nodejs/node/blob/master/src/async_wrap-inl.h
// - https://github.com/nodejs/node/blob/master/src/async_wrap.cc
// - https://github.com/nodejs/node/blob/master/src/async_wrap.h

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

export function registerDestroyHook(
  // deno-lint-ignore no-explicit-any
  _target: any,
  _asyncId: number,
  _prop: { destroyed: boolean },
) {
  // TODO(kt3k): implement actual procedures
}

export enum constants {
  kInit,
  kBefore,
  kAfter,
  kDestroy,
  kPromiseResolve,
  kTotals,
  kCheck,
  kExecutionAsyncId,
  kTriggerAsyncId,
  kAsyncIdCounter,
  kDefaultTriggerAsyncId,
  kUsesExecutionAsyncResource,
  kStackLength,
}

const asyncHookFields = new Uint32Array(Object.keys(constants).length);

export { asyncHookFields as async_hook_fields };

// Increment the internal id counter and return the value.
export function newAsyncId() {
  return ++asyncIdFields[constants.kAsyncIdCounter];
}

export enum UidFields {
  kExecutionAsyncId,
  kTriggerAsyncId,
  kAsyncIdCounter,
  kDefaultTriggerAsyncId,
  kUidFieldsCount,
}

const asyncIdFields = new Float64Array(Object.keys(UidFields).length);

// `kAsyncIdCounter` should start at `1` because that'll be the id the execution
// context during bootstrap.
asyncIdFields[UidFields.kAsyncIdCounter] = 1;

// `kDefaultTriggerAsyncId` should be `-1`, this indicates that there is no
// specified default value and it should fallback to the executionAsyncId.
// 0 is not used as the magic value, because that indicates a missing
// context which is different from a default context.
asyncIdFields[UidFields.kDefaultTriggerAsyncId] = -1;

export { asyncIdFields };

export enum providerType {
  NONE,
  DIRHANDLE,
  DNSCHANNEL,
  ELDHISTOGRAM,
  FILEHANDLE,
  FILEHANDLECLOSEREQ,
  FIXEDSIZEBLOBCOPY,
  FSEVENTWRAP,
  FSREQCALLBACK,
  FSREQPROMISE,
  GETADDRINFOREQWRAP,
  GETNAMEINFOREQWRAP,
  HEAPSNAPSHOT,
  HTTP2SESSION,
  HTTP2STREAM,
  HTTP2PING,
  HTTP2SETTINGS,
  HTTPINCOMINGMESSAGE,
  HTTPCLIENTREQUEST,
  JSSTREAM,
  JSUDPWRAP,
  MESSAGEPORT,
  PIPECONNECTWRAP,
  PIPESERVERWRAP,
  PIPEWRAP,
  PROCESSWRAP,
  PROMISE,
  QUERYWRAP,
  SHUTDOWNWRAP,
  SIGNALWRAP,
  STATWATCHER,
  STREAMPIPE,
  TCPCONNECTWRAP,
  TCPSERVERWRAP,
  TCPWRAP,
  TTYWRAP,
  UDPSENDWRAP,
  UDPWRAP,
  SIGINTWATCHDOG,
  WORKER,
  WORKERHEAPSNAPSHOT,
  WRITEWRAP,
  ZLIB,
}

const kInvalidAsyncId = -1;

export class AsyncWrap {
  provider: providerType = providerType.NONE;
  asyncId = kInvalidAsyncId;

  constructor(provider: providerType) {
    this.provider = provider;
    this.getAsyncId();
  }

  getAsyncId(): number {
    this.asyncId = this.asyncId === kInvalidAsyncId
      ? newAsyncId()
      : this.asyncId;

    return this.asyncId;
  }

  getProviderType() {
    return this.provider;
  }
}
