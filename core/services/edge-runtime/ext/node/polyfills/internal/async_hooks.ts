// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// TODO(petamoriken): enable prefer-primordials for node polyfills
// deno-lint-ignore-file prefer-primordials

// deno-lint-ignore camelcase
import * as async_wrap from "ext:deno_node/internal_binding/async_wrap.ts";
import { ERR_ASYNC_CALLBACK } from "ext:deno_node/internal/errors.ts";
export {
  asyncIdSymbol,
  ownerSymbol,
} from "ext:deno_node/internal_binding/symbols.ts";

interface ActiveHooks {
  array: AsyncHook[];
  // deno-lint-ignore camelcase
  call_depth: number;
  // deno-lint-ignore camelcase
  tmp_array: AsyncHook[] | null;
  // deno-lint-ignore camelcase
  tmp_fields: number[] | null;
}

// Properties in active_hooks are used to keep track of the set of hooks being
// executed in case another hook is enabled/disabled. The new set of hooks is
// then restored once the active set of hooks is finished executing.
// deno-lint-ignore camelcase
const active_hooks: ActiveHooks = {
  // Array of all AsyncHooks that will be iterated whenever an async event
  // fires. Using var instead of (preferably const) in order to assign
  // active_hooks.tmp_array if a hook is enabled/disabled during hook
  // execution.
  array: [],
  // Use a counter to track nested calls of async hook callbacks and make sure
  // the active_hooks.array isn't altered mid execution.
  // deno-lint-ignore camelcase
  call_depth: 0,
  // Use to temporarily store and updated active_hooks.array if the user
  // enables or disables a hook while hooks are being processed. If a hook is
  // enabled() or disabled() during hook execution then the current set of
  // active hooks is duplicated and set equal to active_hooks.tmp_array. Any
  // subsequent changes are on the duplicated array. When all hooks have
  // completed executing active_hooks.tmp_array is assigned to
  // active_hooks.array.
  // deno-lint-ignore camelcase
  tmp_array: null,
  // Keep track of the field counts held in active_hooks.tmp_array. Because the
  // async_hook_fields can't be reassigned, store each uint32 in an array that
  // is written back to async_hook_fields when active_hooks.array is restored.
  // deno-lint-ignore camelcase
  tmp_fields: null,
};

export const registerDestroyHook = async_wrap.registerDestroyHook;
const {
  async_hook_fields,
  // deno-lint-ignore camelcase
  asyncIdFields: async_id_fields,
  newAsyncId,
  constants,
} = async_wrap;
export { newAsyncId };
const {
  kInit,
  kBefore,
  kAfter,
  kDestroy,
  kPromiseResolve,
  kTotals,
  kCheck,
  kDefaultTriggerAsyncId,
  kStackLength,
} = constants;

// deno-lint-ignore camelcase
const resource_symbol = Symbol("resource");
// deno-lint-ignore camelcase
export const async_id_symbol = Symbol("trigger_async_id");
// deno-lint-ignore camelcase
export const trigger_async_id_symbol = Symbol("trigger_async_id");
// deno-lint-ignore camelcase
export const init_symbol = Symbol("init");
// deno-lint-ignore camelcase
export const before_symbol = Symbol("before");
// deno-lint-ignore camelcase
export const after_symbol = Symbol("after");
// deno-lint-ignore camelcase
export const destroy_symbol = Symbol("destroy");
// deno-lint-ignore camelcase
export const promise_resolve_symbol = Symbol("promiseResolve");

export const symbols = {
  // deno-lint-ignore camelcase
  async_id_symbol,
  // deno-lint-ignore camelcase
  trigger_async_id_symbol,
  // deno-lint-ignore camelcase
  init_symbol,
  // deno-lint-ignore camelcase
  before_symbol,
  // deno-lint-ignore camelcase
  after_symbol,
  // deno-lint-ignore camelcase
  destroy_symbol,
  // deno-lint-ignore camelcase
  promise_resolve_symbol,
};

// deno-lint-ignore no-explicit-any
function lookupPublicResource(resource: any) {
  if (typeof resource !== "object" || resource === null) return resource;
  // TODO(addaleax): Merge this with owner_symbol and use it across all
  // AsyncWrap instances.
  const publicResource = resource[resource_symbol];
  if (publicResource !== undefined) {
    return publicResource;
  }
  return resource;
}

// Used by C++ to call all init() callbacks. Because some state can be setup
// from C++ there's no need to perform all the same operations as in
// emitInitScript.
function emitInitNative(
  asyncId: number,
  // deno-lint-ignore no-explicit-any
  type: any,
  triggerAsyncId: number,
  // deno-lint-ignore no-explicit-any
  resource: any,
) {
  active_hooks.call_depth += 1;
  resource = lookupPublicResource(resource);
  // Use a single try/catch for all hooks to avoid setting up one per iteration.
  try {
    for (let i = 0; i < active_hooks.array.length; i++) {
      if (typeof active_hooks.array[i][init_symbol] === "function") {
        active_hooks.array[i][init_symbol](
          asyncId,
          type,
          triggerAsyncId,
          resource,
        );
      }
    }
  } catch (e) {
    throw e;
  } finally {
    active_hooks.call_depth -= 1;
  }

  // Hooks can only be restored if there have been no recursive hook calls.
  // Also the active hooks do not need to be restored if enable()/disable()
  // weren't called during hook execution, in which case active_hooks.tmp_array
  // will be null.
  if (active_hooks.call_depth === 0 && active_hooks.tmp_array !== null) {
    restoreActiveHooks();
  }
}

function getHookArrays(): [AsyncHook[], number[] | Uint32Array] {
  if (active_hooks.call_depth === 0) {
    return [active_hooks.array, async_hook_fields];
  }
  // If this hook is being enabled while in the middle of processing the array
  // of currently active hooks then duplicate the current set of active hooks
  // and store this there. This shouldn't fire until the next time hooks are
  // processed.
  if (active_hooks.tmp_array === null) {
    storeActiveHooks();
  }
  return [active_hooks.tmp_array!, active_hooks.tmp_fields!];
}

function storeActiveHooks() {
  active_hooks.tmp_array = active_hooks.array.slice();
  // Don't want to make the assumption that kInit to kDestroy are indexes 0 to
  // 4. So do this the long way.
  active_hooks.tmp_fields = [];
  copyHooks(active_hooks.tmp_fields, async_hook_fields);
}

function copyHooks(
  destination: number[] | Uint32Array,
  source: number[] | Uint32Array,
) {
  destination[kInit] = source[kInit];
  destination[kBefore] = source[kBefore];
  destination[kAfter] = source[kAfter];
  destination[kDestroy] = source[kDestroy];
  destination[kPromiseResolve] = source[kPromiseResolve];
}

// Then restore the correct hooks array in case any hooks were added/removed
// during hook callback execution.
function restoreActiveHooks() {
  active_hooks.array = active_hooks.tmp_array!;
  copyHooks(async_hook_fields, active_hooks.tmp_fields!);

  active_hooks.tmp_array = null;
  active_hooks.tmp_fields = null;
}

// deno-lint-ignore no-unused-vars
let wantPromiseHook = false;
function enableHooks() {
  async_hook_fields[kCheck] += 1;

  // TODO(kt3k): Uncomment this
  // setCallbackTrampoline(callbackTrampoline);
}

function disableHooks() {
  async_hook_fields[kCheck] -= 1;

  wantPromiseHook = false;

  // TODO(kt3k): Uncomment the below
  // setCallbackTrampoline();

  // Delay the call to `disablePromiseHook()` because we might currently be
  // between the `before` and `after` calls of a Promise.
  // TODO(kt3k): Uncomment the below
  // enqueueMicrotask(disablePromiseHookIfNecessary);
}

// Return the triggerAsyncId meant for the constructor calling it. It's up to
// the user to safeguard this call and make sure it's zero'd out when the
// constructor is complete.
export function getDefaultTriggerAsyncId() {
  const defaultTriggerAsyncId =
    async_id_fields[async_wrap.UidFields.kDefaultTriggerAsyncId];
  // If defaultTriggerAsyncId isn't set, use the executionAsyncId
  if (defaultTriggerAsyncId < 0) {
    return async_id_fields[async_wrap.UidFields.kExecutionAsyncId];
  }
  return defaultTriggerAsyncId;
}

export function defaultTriggerAsyncIdScope(
  triggerAsyncId: number | undefined,
  // deno-lint-ignore no-explicit-any
  block: (...arg: any[]) => void,
  ...args: unknown[]
) {
  if (triggerAsyncId === undefined) {
    return block.apply(null, args);
  }
  // CHECK(NumberIsSafeInteger(triggerAsyncId))
  // CHECK(triggerAsyncId > 0)
  const oldDefaultTriggerAsyncId = async_id_fields[kDefaultTriggerAsyncId];
  async_id_fields[kDefaultTriggerAsyncId] = triggerAsyncId;

  try {
    return block.apply(null, args);
  } finally {
    async_id_fields[kDefaultTriggerAsyncId] = oldDefaultTriggerAsyncId;
  }
}

function hasHooks(key: number) {
  return async_hook_fields[key] > 0;
}

export function enabledHooksExist() {
  return hasHooks(kCheck);
}

export function initHooksExist() {
  return hasHooks(kInit);
}

export function afterHooksExist() {
  return hasHooks(kAfter);
}

export function destroyHooksExist() {
  return hasHooks(kDestroy);
}

export function promiseResolveHooksExist() {
  return hasHooks(kPromiseResolve);
}

function emitInitScript(
  asyncId: number,
  // deno-lint-ignore no-explicit-any
  type: any,
  triggerAsyncId: number,
  // deno-lint-ignore no-explicit-any
  resource: any,
) {
  // Short circuit all checks for the common case. Which is that no hooks have
  // been set. Do this to remove performance impact for embedders (and core).
  if (!hasHooks(kInit)) {
    return;
  }

  if (triggerAsyncId === null) {
    triggerAsyncId = getDefaultTriggerAsyncId();
  }

  emitInitNative(asyncId, type, triggerAsyncId, resource);
}
export { emitInitScript as emitInit };

export function hasAsyncIdStack() {
  return hasHooks(kStackLength);
}

export { constants };

type Fn = (...args: unknown[]) => unknown;

export class AsyncHook {
  [init_symbol]: Fn;
  [before_symbol]: Fn;
  [after_symbol]: Fn;
  [destroy_symbol]: Fn;
  [promise_resolve_symbol]: Fn;

  constructor({
    init,
    before,
    after,
    destroy,
    promiseResolve,
  }: {
    init: Fn;
    before: Fn;
    after: Fn;
    destroy: Fn;
    promiseResolve: Fn;
  }) {
    if (init !== undefined && typeof init !== "function") {
      throw new ERR_ASYNC_CALLBACK("hook.init");
    }
    if (before !== undefined && typeof before !== "function") {
      throw new ERR_ASYNC_CALLBACK("hook.before");
    }
    if (after !== undefined && typeof after !== "function") {
      throw new ERR_ASYNC_CALLBACK("hook.after");
    }
    if (destroy !== undefined && typeof destroy !== "function") {
      throw new ERR_ASYNC_CALLBACK("hook.destroy");
    }
    if (promiseResolve !== undefined && typeof promiseResolve !== "function") {
      throw new ERR_ASYNC_CALLBACK("hook.promiseResolve");
    }

    this[init_symbol] = init;
    this[before_symbol] = before;
    this[after_symbol] = after;
    this[destroy_symbol] = destroy;
    this[promise_resolve_symbol] = promiseResolve;
  }

  enable() {
    // The set of callbacks for a hook should be the same regardless of whether
    // enable()/disable() are run during their execution. The following
    // references are reassigned to the tmp arrays if a hook is currently being
    // processed.
    // deno-lint-ignore camelcase
    const { 0: hooks_array, 1: hook_fields } = getHookArrays();

    // Each hook is only allowed to be added once.
    if (hooks_array.includes(this)) {
      return this;
    }

    // deno-lint-ignore camelcase
    const prev_kTotals = hook_fields[kTotals];

    // createHook() has already enforced that the callbacks are all functions,
    // so here simply increment the count of whether each callbacks exists or
    // not.
    hook_fields[kTotals] = hook_fields[kInit] += +!!this[init_symbol];
    hook_fields[kTotals] += hook_fields[kBefore] += +!!this[before_symbol];
    hook_fields[kTotals] += hook_fields[kAfter] += +!!this[after_symbol];
    hook_fields[kTotals] += hook_fields[kDestroy] += +!!this[destroy_symbol];
    hook_fields[kTotals] += hook_fields[kPromiseResolve] +=
      +!!this[promise_resolve_symbol];
    hooks_array.push(this);

    if (prev_kTotals === 0 && hook_fields[kTotals] > 0) {
      enableHooks();
    }

    // TODO(kt3k): Uncomment the below
    // updatePromiseHookMode();

    return this;
  }

  disable() {
    // deno-lint-ignore camelcase
    const { 0: hooks_array, 1: hook_fields } = getHookArrays();

    const index = hooks_array.indexOf(this);
    if (index === -1) {
      return this;
    }

    // deno-lint-ignore camelcase
    const prev_kTotals = hook_fields[kTotals];

    hook_fields[kTotals] = hook_fields[kInit] -= +!!this[init_symbol];
    hook_fields[kTotals] += hook_fields[kBefore] -= +!!this[before_symbol];
    hook_fields[kTotals] += hook_fields[kAfter] -= +!!this[after_symbol];
    hook_fields[kTotals] += hook_fields[kDestroy] -= +!!this[destroy_symbol];
    hook_fields[kTotals] += hook_fields[kPromiseResolve] -=
      +!!this[promise_resolve_symbol];
    hooks_array.splice(index, 1);

    if (prev_kTotals > 0 && hook_fields[kTotals] === 0) {
      disableHooks();
    }

    return this;
  }
}
