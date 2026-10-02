import { core, internals } from "ext:core/mod.js";

const { AsyncVariable } = core;

const requestTraceIdVar = new AsyncVariable();

function enterRequestContext(traceId) {
  return requestTraceIdVar.enter(traceId);
}

function getRequestTraceId() {
  return requestTraceIdVar.get();
}

internals.enterRequestContext = enterRequestContext;
internals.getRequestTraceId = getRequestTraceId;

export { enterRequestContext, getRequestTraceId };
