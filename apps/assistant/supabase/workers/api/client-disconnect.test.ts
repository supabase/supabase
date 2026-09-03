import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { describe, expect, test } from 'vitest'

import { abortOnClientDisconnect } from './client-disconnect'

function fakeReq() {
  return new EventEmitter() as IncomingMessage
}

function fakeRes(writableEnded: boolean) {
  const res = new EventEmitter() as ServerResponse
  Object.defineProperty(res, 'writableEnded', { get: () => writableEnded })
  return res
}

describe('abortOnClientDisconnect', () => {
  test('does not abort when the request body finishes (IncomingMessage close)', () => {
    const abort = new AbortController()
    const req = fakeReq()
    abortOnClientDisconnect(req, fakeRes(false), abort)

    req.emit('close')

    expect(abort.signal.aborted).toBe(false)
  })

  test('aborts when the client drops the response', () => {
    const abort = new AbortController()
    const res = fakeRes(false)
    abortOnClientDisconnect(fakeReq(), res, abort)

    res.emit('close')

    expect(abort.signal.aborted).toBe(true)
  })

  test('does not abort after the response has finished writing', () => {
    const abort = new AbortController()
    const res = fakeRes(true)
    abortOnClientDisconnect(fakeReq(), res, abort)

    res.emit('close')

    expect(abort.signal.aborted).toBe(false)
  })

  test('aborts when the request is aborted by the client', () => {
    const abort = new AbortController()
    const req = fakeReq()
    abortOnClientDisconnect(req, fakeRes(false), abort)

    req.emit('aborted')

    expect(abort.signal.aborted).toBe(true)
  })
})
