// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

// deno-lint-ignore-file
import {
  isAnyArrayBuffer,
  isArrayBufferView,
  isBigIntObject,
  isBooleanObject,
  isBoxedPrimitive,
  isDate,
  isFloat32Array,
  isFloat64Array,
  isMap,
  isNativeError,
  isNumberObject,
  isRegExp,
  isSet,
  isStringObject,
  isSymbolObject,
  isTypedArray,
} from "ext:deno_node/internal/util/types.ts";

import { Buffer } from "node:buffer";
import {
  getOwnNonIndexProperties,
  ONLY_ENUMERABLE,
  SKIP_SYMBOLS,
} from "ext:deno_node/internal_binding/util.ts";

enum valueType {
  noIterator,
  isArray,
  isSet,
  isMap,
}

interface Memo {
  val1: Map<unknown, unknown>;
  val2: Map<unknown, unknown>;
  position: number;
}
let memo: Memo;

export function isDeepStrictEqual(val1: unknown, val2: unknown): boolean {
  return innerDeepEqual(val1, val2, true);
}
export function isDeepEqual(val1: unknown, val2: unknown): boolean {
  return innerDeepEqual(val1, val2, false);
}

function innerDeepEqual(
  val1: unknown,
  val2: unknown,
  strict: boolean,
  memos = memo,
): boolean {
  // Basic case covered by Strict Equality Comparison
  if (val1 === val2) {
    if (val1 !== 0) return true;
    return strict ? Object.is(val1, val2) : true;
  }
  if (strict) {
    // Cases where the values are not objects
    // If both values are Not a Number NaN
    if (typeof val1 !== "object") {
      return (
        typeof val1 === "number" && Number.isNaN(val1) && Number.isNaN(val2)
      );
    }
    // If either value is null
    if (typeof val2 !== "object" || val1 === null || val2 === null) {
      return false;
    }
    // If the prototype are not the same
    if (Object.getPrototypeOf(val1) !== Object.getPrototypeOf(val2)) {
      return false;
    }
  } else {
    // Non strict case where values are either null or NaN
    if (val1 === null || typeof val1 !== "object") {
      if (val2 === null || typeof val2 !== "object") {
        return val1 == val2 || (Number.isNaN(val1) && Number.isNaN(val2));
      }
      return false;
    }
    if (val2 === null || typeof val2 !== "object") {
      return false;
    }
  }

  const val1Tag = Object.prototype.toString.call(val1);
  const val2Tag = Object.prototype.toString.call(val2);

  // prototype must be Strictly Equal
  if (
    val1Tag !== val2Tag
  ) {
    return false;
  }

  // handling when values are array
  if (Array.isArray(val1)) {
    // quick rejection cases
    if (!Array.isArray(val2) || val1.length !== val2.length) {
      return false;
    }
    const filter = strict ? ONLY_ENUMERABLE : ONLY_ENUMERABLE | SKIP_SYMBOLS;
    const keys1 = getOwnNonIndexProperties(val1, filter);
    const keys2 = getOwnNonIndexProperties(val2, filter);
    if (keys1.length !== keys2.length) {
      return false;
    }
    return keyCheck(val1, val2, strict, memos, valueType.isArray, keys1);
  } else if (val1Tag === "[object Object]") {
    return keyCheck(
      val1 as object,
      val2 as object,
      strict,
      memos,
      valueType.noIterator,
    );
  } else if (val1 instanceof Date) {
    if (!(val2 instanceof Date) || val1.getTime() !== val2.getTime()) {
      return false;
    }
  } else if (val1 instanceof RegExp) {
    if (!(val2 instanceof RegExp) || !areSimilarRegExps(val1, val2)) {
      return false;
    }
  } else if (isNativeError(val1) || val1 instanceof Error) {
    // stack may or may not be same, hence it shouldn't be compared
    if (
      // How to handle the type errors here
      (!isNativeError(val2) && !(val2 instanceof Error)) ||
      (val1 as Error).message !== (val2 as Error).message ||
      (val1 as Error).name !== (val2 as Error).name
    ) {
      return false;
    }
  } else if (isArrayBufferView(val1)) {
    const TypedArrayPrototypeGetSymbolToStringTag = (
      val:
        | BigInt64Array
        | BigUint64Array
        | Float32Array
        | Float64Array
        | Int8Array
        | Int16Array
        | Int32Array
        | Uint8Array
        | Uint8ClampedArray
        | Uint16Array
        | Uint32Array,
    ) =>
      Object.getOwnPropertySymbols(val)
        .map((item) => item.toString())
        .toString();
    if (
      isTypedArray(val1) &&
      isTypedArray(val2) &&
      (TypedArrayPrototypeGetSymbolToStringTag(val1) !==
        TypedArrayPrototypeGetSymbolToStringTag(val2))
    ) {
      return false;
    }

    if (!strict && (isFloat32Array(val1) || isFloat64Array(val1))) {
      if (!areSimilarFloatArrays(val1, val2)) {
        return false;
      }
    } else if (!areSimilarTypedArrays(val1, val2)) {
      return false;
    }
    const filter = strict ? ONLY_ENUMERABLE : ONLY_ENUMERABLE | SKIP_SYMBOLS;
    const keysVal1 = getOwnNonIndexProperties(val1 as object, filter);
    const keysVal2 = getOwnNonIndexProperties(val2 as object, filter);
    if (keysVal1.length !== keysVal2.length) {
      return false;
    }
    return keyCheck(
      val1 as object,
      val2 as object,
      strict,
      memos,
      valueType.noIterator,
      keysVal1,
    );
  } else if (isSet(val1)) {
    if (
      !isSet(val2) ||
      (val1 as Set<unknown>).size !== (val2 as Set<unknown>).size
    ) {
      return false;
    }
    return keyCheck(
      val1 as object,
      val2 as object,
      strict,
      memos,
      valueType.isSet,
    );
  } else if (isMap(val1)) {
    if (
      !isMap(val2) || val1.size !== val2.size
    ) {
      return false;
    }
    return keyCheck(
      val1 as object,
      val2 as object,
      strict,
      memos,
      valueType.isMap,
    );
  } else if (isAnyArrayBuffer(val1)) {
    if (!isAnyArrayBuffer(val2) || !areEqualArrayBuffers(val1, val2)) {
      return false;
    }
  } else if (isBoxedPrimitive(val1)) {
    if (!isEqualBoxedPrimitive(val1, val2)) {
      return false;
    }
  } else if (
    Array.isArray(val2) ||
    isArrayBufferView(val2) ||
    isSet(val2) ||
    isMap(val2) ||
    isDate(val2) ||
    isRegExp(val2) ||
    isAnyArrayBuffer(val2) ||
    isBoxedPrimitive(val2) ||
    isNativeError(val2) ||
    val2 instanceof Error
  ) {
    return false;
  }
  return keyCheck(
    val1 as object,
    val2 as object,
    strict,
    memos,
    valueType.noIterator,
  );
}

function keyCheck(
  val1: object,
  val2: object,
  strict: boolean,
  memos: Memo,
  iterationType: valueType,
  aKeys: (string | symbol)[] = [],
) {
  if (arguments.length === 5) {
    aKeys = Object.keys(val1);
    const bKeys = Object.keys(val2);

    // The pair must have the same number of owned properties.
    if (aKeys.length !== bKeys.length) {
      return false;
    }
  }

  // Cheap key test
  let i = 0;
  for (; i < aKeys.length; i++) {
    if (!val2.propertyIsEnumerable(aKeys[i])) {
      return false;
    }
  }

  if (strict && arguments.length === 5) {
    const symbolKeysA = Object.getOwnPropertySymbols(val1);
    if (symbolKeysA.length !== 0) {
      let count = 0;
      for (i = 0; i < symbolKeysA.length; i++) {
        const key = symbolKeysA[i];
        if (val1.propertyIsEnumerable(key)) {
          if (!val2.propertyIsEnumerable(key)) {
            return false;
          }
          // added toString here
          aKeys.push(key.toString());
          count++;
        } else if (val2.propertyIsEnumerable(key)) {
          return false;
        }
      }
      const symbolKeysB = Object.getOwnPropertySymbols(val2);
      if (
        symbolKeysA.length !== symbolKeysB.length &&
        getEnumerables(val2, symbolKeysB).length !== count
      ) {
        return false;
      }
    } else {
      const symbolKeysB = Object.getOwnPropertySymbols(val2);
      if (
        symbolKeysB.length !== 0 &&
        getEnumerables(val2, symbolKeysB).length !== 0
      ) {
        return false;
      }
    }
  }
  if (
    aKeys.length === 0 &&
    (iterationType === valueType.noIterator ||
      (iterationType === valueType.isArray && (val1 as []).length === 0) ||
      (val1 as Set<unknown>).size === 0)
  ) {
    return true;
  }

  if (memos === undefined) {
    memos = {
      val1: new Map(),
      val2: new Map(),
      position: 0,
    };
  } else {
    const val2MemoA = memos.val1.get(val1);
    if (val2MemoA !== undefined) {
      const val2MemoB = memos.val2.get(val2);
      if (val2MemoB !== undefined) {
        return val2MemoA === val2MemoB;
      }
    }
    memos.position++;
  }

  memos.val1.set(val1, memos.position);
  memos.val2.set(val2, memos.position);

  const areEq = objEquiv(val1, val2, strict, aKeys, memos, iterationType);

  memos.val1.delete(val1);
  memos.val2.delete(val2);

  return areEq;
}

function areSimilarRegExps(a: RegExp, b: RegExp) {
  return a.source === b.source && a.flags === b.flags &&
    a.lastIndex === b.lastIndex;
}

// TODO(standvpmnt): add type for arguments
function areSimilarFloatArrays(arr1: any, arr2: any): boolean {
  if (arr1.byteLength !== arr2.byteLength) {
    return false;
  }
  for (let i = 0; i < arr1.byteLength; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

// TODO(standvpmnt): add type for arguments
function areSimilarTypedArrays(arr1: any, arr2: any): boolean {
  if (arr1.byteLength !== arr2.byteLength) {
    return false;
  }
  return (
    Buffer.compare(
      new Uint8Array(arr1.buffer, arr1.byteOffset, arr1.byteLength),
      new Uint8Array(arr2.buffer, arr2.byteOffset, arr2.byteLength),
    ) === 0
  );
}
// TODO(standvpmnt): add type for arguments
function areEqualArrayBuffers(buf1: any, buf2: any): boolean {
  return (
    buf1.byteLength === buf2.byteLength &&
    Buffer.compare(new Uint8Array(buf1), new Uint8Array(buf2)) === 0
  );
}

// TODO(standvpmnt):  this check of getOwnPropertySymbols and getOwnPropertyNames
// length is sufficient to handle the current test case, however this will fail
// to catch a scenario wherein the getOwnPropertySymbols and getOwnPropertyNames
// length is the same(will be very contrived but a possible shortcoming
function isEqualBoxedPrimitive(a: any, b: any): boolean {
  if (
    Object.getOwnPropertyNames(a).length !==
      Object.getOwnPropertyNames(b).length
  ) {
    return false;
  }
  if (
    Object.getOwnPropertySymbols(a).length !==
      Object.getOwnPropertySymbols(b).length
  ) {
    return false;
  }
  if (isNumberObject(a)) {
    return (
      isNumberObject(b) &&
      Object.is(
        Number.prototype.valueOf.call(a),
        Number.prototype.valueOf.call(b),
      )
    );
  }
  if (isStringObject(a)) {
    return (
      isStringObject(b) &&
      (String.prototype.valueOf.call(a) === String.prototype.valueOf.call(b))
    );
  }
  if (isBooleanObject(a)) {
    return (
      isBooleanObject(b) &&
      (Boolean.prototype.valueOf.call(a) === Boolean.prototype.valueOf.call(b))
    );
  }
  if (isBigIntObject(a)) {
    return (
      isBigIntObject(b) &&
      (BigInt.prototype.valueOf.call(a) === BigInt.prototype.valueOf.call(b))
    );
  }
  if (isSymbolObject(a)) {
    return (
      isSymbolObject(b) &&
      (Symbol.prototype.valueOf.call(a) ===
        Symbol.prototype.valueOf.call(b))
    );
  }
  // assert.fail(`Unknown boxed type ${val1}`);
  // return false;
  throw new Error(`Unknown boxed type`);
}

function getEnumerables(val: any, keys: any) {
  return keys.filter((key: string) => val.propertyIsEnumerable(key));
}

function objEquiv(
  obj1: any,
  obj2: any,
  strict: boolean,
  keys: any,
  memos: Memo,
  iterationType: valueType,
): boolean {
  let i = 0;

  if (iterationType === valueType.isSet) {
    if (!setEquiv(obj1, obj2, strict, memos)) {
      return false;
    }
  } else if (iterationType === valueType.isMap) {
    if (!mapEquiv(obj1, obj2, strict, memos)) {
      return false;
    }
  } else if (iterationType === valueType.isArray) {
    for (; i < obj1.length; i++) {
      if (obj1.hasOwnProperty(i)) {
        if (
          !obj2.hasOwnProperty(i) ||
          !innerDeepEqual(obj1[i], obj2[i], strict, memos)
        ) {
          return false;
        }
      } else if (obj2.hasOwnProperty(i)) {
        return false;
      } else {
        const keys1 = Object.keys(obj1);
        for (; i < keys1.length; i++) {
          const key = keys1[i];
          if (
            !obj2.hasOwnProperty(key) ||
            !innerDeepEqual(obj1[key], obj2[key], strict, memos)
          ) {
            return false;
          }
        }
        if (keys1.length !== Object.keys(obj2).length) {
          return false;
        }
        if (keys1.length !== Object.keys(obj2).length) {
          return false;
        }
        return true;
      }
    }
  }

  // Expensive test
  for (i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!innerDeepEqual(obj1[key], obj2[key], strict, memos)) {
      return false;
    }
  }
  return true;
}

function findLooseMatchingPrimitives(
  primitive: unknown,
): boolean | null | undefined {
  switch (typeof primitive) {
    case "undefined":
      return null;
    case "object":
      return undefined;
    case "symbol":
      return false;
    case "string":
      primitive = +primitive;
    case "number":
      if (Number.isNaN(primitive)) {
        return false;
      }
  }
  return true;
}

function setMightHaveLoosePrim(
  set1: Set<unknown>,
  set2: Set<unknown>,
  primitive: any,
) {
  const altValue = findLooseMatchingPrimitives(primitive);
  if (altValue != null) return altValue;

  return set2.has(altValue) && !set1.has(altValue);
}

function setHasEqualElement(
  set: any,
  val1: any,
  strict: boolean,
  memos: Memo,
): boolean {
  for (const val2 of set) {
    if (innerDeepEqual(val1, val2, strict, memos)) {
      set.delete(val2);
      return true;
    }
  }

  return false;
}

function setEquiv(set1: any, set2: any, strict: boolean, memos: Memo): boolean {
  let set = null;
  for (const item of set1) {
    if (typeof item === "object" && item !== null) {
      if (set === null) {
        // What is SafeSet from primordials?
        // set = new SafeSet();
        set = new Set();
      }
      set.add(item);
    } else if (!set2.has(item)) {
      if (strict) return false;

      if (!setMightHaveLoosePrim(set1, set2, item)) {
        return false;
      }

      if (set === null) {
        set = new Set();
      }
      set.add(item);
    }
  }

  if (set !== null) {
    for (const item of set2) {
      if (typeof item === "object" && item !== null) {
        if (!setHasEqualElement(set, item, strict, memos)) return false;
      } else if (
        !strict &&
        !set1.has(item) &&
        !setHasEqualElement(set, item, strict, memos)
      ) {
        return false;
      }
    }
    return set.size === 0;
  }

  return true;
}

// TODO(standvpmnt): add types for argument
function mapMightHaveLoosePrimitive(
  map1: Map<unknown, unknown>,
  map2: Map<unknown, unknown>,
  primitive: any,
  item: any,
  memos: Memo,
): boolean {
  const altValue = findLooseMatchingPrimitives(primitive);
  if (altValue != null) {
    return altValue;
  }
  const curB = map2.get(altValue);
  if (
    (curB === undefined && !map2.has(altValue)) ||
    !innerDeepEqual(item, curB, false, memo)
  ) {
    return false;
  }
  return !map1.has(altValue) && innerDeepEqual(item, curB, false, memos);
}

function mapEquiv(map1: any, map2: any, strict: boolean, memos: Memo): boolean {
  let set = null;

  for (const { 0: key, 1: item1 } of map1) {
    if (typeof key === "object" && key !== null) {
      if (set === null) {
        set = new Set();
      }
      set.add(key);
    } else {
      const item2 = map2.get(key);
      if (
        (
          (item2 === undefined && !map2.has(key)) ||
          !innerDeepEqual(item1, item2, strict, memos)
        )
      ) {
        if (strict) return false;
        if (!mapMightHaveLoosePrimitive(map1, map2, key, item1, memos)) {
          return false;
        }
        if (set === null) {
          set = new Set();
        }
        set.add(key);
      }
    }
  }

  if (set !== null) {
    for (const { 0: key, 1: item } of map2) {
      if (typeof key === "object" && key !== null) {
        if (!mapHasEqualEntry(set, map1, key, item, strict, memos)) {
          return false;
        }
      } else if (
        !strict && (!map1.has(key) ||
          !innerDeepEqual(map1.get(key), item, false, memos)) &&
        !mapHasEqualEntry(set, map1, key, item, false, memos)
      ) {
        return false;
      }
    }
    return set.size === 0;
  }

  return true;
}

function mapHasEqualEntry(
  set: any,
  map: any,
  key1: any,
  item1: any,
  strict: boolean,
  memos: Memo,
): boolean {
  for (const key2 of set) {
    if (
      innerDeepEqual(key1, key2, strict, memos) &&
      innerDeepEqual(item1, map.get(key2), strict, memos)
    ) {
      set.delete(key2);
      return true;
    }
  }
  return false;
}
