// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// @ts-check
/// <reference path="../webidl/internal.d.ts" />
/// <reference path="../web/internal.d.ts" />
/// <reference path="../web/lib.deno_web.d.ts" />
/// <reference path="./internal.d.ts" />
/// <reference path="../web/06_streams_types.d.ts" />
/// <reference path="./lib.deno_fetch.d.ts" />
/// <reference lib="esnext" />

import { core, primordials } from "ext:core/mod.js";
import * as webidl from "ext:deno_webidl/00_webidl.js";
import {
  Blob,
  BlobPrototype,
  File,
  FilePrototype,
} from "ext:deno_web/09_file.js";
const {
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ArrayPrototypeSplice,
  MapPrototypeGet,
  MapPrototypeSet,
  MathRandom,
  ObjectFreeze,
  ObjectFromEntries,
  ObjectPrototypeIsPrototypeOf,
  SafeMap,
  SafeRegExp,
  Symbol,
  SymbolFor,
  StringFromCharCode,
  StringPrototypeCharCodeAt,
  StringPrototypeTrim,
  StringPrototypeSlice,
  StringPrototypeSplit,
  StringPrototypeReplace,
  StringPrototypeIndexOf,
  StringPrototypePadStart,
  StringPrototypeCodePointAt,
  StringPrototypeReplaceAll,
  TypeError,
  TypedArrayPrototypeSubarray,
  Uint8Array,
} = primordials;

const entryList = Symbol("entry list");

/**
 * @param {string} name
 * @param {string | Blob} value
 * @param {string | undefined} filename
 * @returns {FormDataEntry}
 */
function createEntry(name, value, filename) {
  if (
    ObjectPrototypeIsPrototypeOf(BlobPrototype, value) &&
    !ObjectPrototypeIsPrototypeOf(FilePrototype, value)
  ) {
    value = new File([value], "blob", { type: value.type });
  }
  if (
    ObjectPrototypeIsPrototypeOf(FilePrototype, value) &&
    filename !== undefined
  ) {
    value = new File([value], filename, {
      type: value.type,
      lastModified: value.lastModified,
    });
  }
  return {
    name,
    // @ts-expect-error because TS is not smart enough
    value,
  };
}

/**
 * @typedef FormDataEntry
 * @property {string} name
 * @property {FormDataEntryValue} value
 */

class FormData {
  /** @type {FormDataEntry[]} */
  [entryList] = [];

  /** @param {void} form */
  constructor(form) {
    if (form !== undefined) {
      webidl.illegalConstructor();
    }
    this[webidl.brand] = webidl.brand;
  }

  /**
   * @param {string} name
   * @param {string | Blob} valueOrBlobValue
   * @param {string} [filename]
   * @returns {void}
   */
  append(name, valueOrBlobValue, filename) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'append' on 'FormData'";
    webidl.requiredArguments(arguments.length, 2, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");
    if (ObjectPrototypeIsPrototypeOf(BlobPrototype, valueOrBlobValue)) {
      valueOrBlobValue = webidl.converters["Blob"](
        valueOrBlobValue,
        prefix,
        "Argument 2",
      );
      if (filename !== undefined) {
        filename = webidl.converters["USVString"](
          filename,
          prefix,
          "Argument 3",
        );
      }
    } else {
      valueOrBlobValue = webidl.converters["USVString"](
        valueOrBlobValue,
        prefix,
        "Argument 2",
      );
    }

    const entry = createEntry(name, valueOrBlobValue, filename);

    ArrayPrototypePush(this[entryList], entry);
  }

  /**
   * @param {string} name
   * @returns {void}
   */
  delete(name) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'name' on 'FormData'";
    webidl.requiredArguments(arguments.length, 1, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");

    const list = this[entryList];
    for (let i = 0; i < list.length; i++) {
      if (list[i].name === name) {
        ArrayPrototypeSplice(list, i, 1);
        i--;
      }
    }
  }

  /**
   * @param {string} name
   * @returns {FormDataEntryValue | null}
   */
  get(name) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'get' on 'FormData'";
    webidl.requiredArguments(arguments.length, 1, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");

    const entries = this[entryList];
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (entry.name === name) return entry.value;
    }
    return null;
  }

  /**
   * @param {string} name
   * @returns {FormDataEntryValue[]}
   */
  getAll(name) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'getAll' on 'FormData'";
    webidl.requiredArguments(arguments.length, 1, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");

    const returnList = [];
    const entries = this[entryList];
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (entry.name === name) ArrayPrototypePush(returnList, entry.value);
    }
    return returnList;
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'has' on 'FormData'";
    webidl.requiredArguments(arguments.length, 1, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");

    const entries = this[entryList];
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (entry.name === name) return true;
    }
    return false;
  }

  /**
   * @param {string} name
   * @param {string | Blob} valueOrBlobValue
   * @param {string} [filename]
   * @returns {void}
   */
  set(name, valueOrBlobValue, filename) {
    webidl.assertBranded(this, FormDataPrototype);
    const prefix = "Failed to execute 'set' on 'FormData'";
    webidl.requiredArguments(arguments.length, 2, prefix);

    name = webidl.converters["USVString"](name, prefix, "Argument 1");
    if (ObjectPrototypeIsPrototypeOf(BlobPrototype, valueOrBlobValue)) {
      valueOrBlobValue = webidl.converters["Blob"](
        valueOrBlobValue,
        prefix,
        "Argument 2",
      );
      if (filename !== undefined) {
        filename = webidl.converters["USVString"](
          filename,
          prefix,
          "Argument 3",
        );
      }
    } else {
      valueOrBlobValue = webidl.converters["USVString"](
        valueOrBlobValue,
        prefix,
        "Argument 2",
      );
    }

    const entry = createEntry(name, valueOrBlobValue, filename);

    const list = this[entryList];
    let added = false;
    for (let i = 0; i < list.length; i++) {
      if (list[i].name === name) {
        if (!added) {
          list[i] = entry;
          added = true;
        } else {
          ArrayPrototypeSplice(list, i, 1);
          i--;
        }
      }
    }
    if (!added) {
      ArrayPrototypePush(list, entry);
    }
  }

  [SymbolFor("Deno.privateCustomInspect")](inspect, inspectOptions) {
    if (ObjectPrototypeIsPrototypeOf(FormDataPrototype, this)) {
      return `${this.constructor.name} ${
        inspect(ObjectFromEntries(this), inspectOptions)
      }`;
    } else {
      return `${this.constructor.name} ${inspect({}, inspectOptions)}`;
    }
  }
}

webidl.mixinPairIterable("FormData", FormData, entryList, "name", "value");

webidl.configureInterface(FormData);
const FormDataPrototype = FormData.prototype;

const ESCAPE_FILENAME_PATTERN = new SafeRegExp(/\r?\n|\r/g);
const ESCAPE_PATTERN = new SafeRegExp(/([\n\r"])/g);
const ESCAPE_MAP = ObjectFreeze({
  "\n": "%0A",
  "\r": "%0D",
  '"': "%22",
});

function escape(str, isFilename) {
  return StringPrototypeReplace(
    isFilename
      ? str
      : StringPrototypeReplace(str, ESCAPE_FILENAME_PATTERN, "\r\n"),
    ESCAPE_PATTERN,
    (c) => ESCAPE_MAP[c],
  );
}

const FORM_DETA_SERIALIZE_PATTERN = new SafeRegExp(/\r(?!\n)|(?<!\r)\n/g);

/**
 * convert FormData to a Blob synchronous without reading all of the files
 * @param {globalThis.FormData} formData
 */
function formDataToBlob(formData) {
  const boundary = StringPrototypePadStart(
    StringPrototypeSlice(
      StringPrototypeReplaceAll(`${MathRandom()}${MathRandom()}`, ".", ""),
      -28,
    ),
    32,
    "-",
  );
  const chunks = [];
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="`;

  // deno-lint-ignore prefer-primordials
  for (const { 0: name, 1: value } of formData) {
    if (typeof value === "string") {
      ArrayPrototypePush(
        chunks,
        prefix + escape(name) + '"' + CRLF + CRLF +
          StringPrototypeReplace(
            value,
            FORM_DETA_SERIALIZE_PATTERN,
            CRLF,
          ) + CRLF,
      );
    } else {
      ArrayPrototypePush(
        chunks,
        prefix + escape(name) + `"; filename="${escape(value.name, true)}"` +
          CRLF +
          `Content-Type: ${value.type || "application/octet-stream"}\r\n\r\n`,
        value,
        CRLF,
      );
    }
  }

  ArrayPrototypePush(chunks, `--${boundary}--`);

  return new Blob(chunks, {
    type: "multipart/form-data; boundary=" + boundary,
  });
}

const QUOTE_CONTENT_PATTERN = new SafeRegExp(/^"([^"]*)"$/);

/**
 * @param {string} value
 * @returns {Map<string, string>}
 */
function parseContentDisposition(value) {
  /** @type {Map<string, string>} */
  const params = new SafeMap();
  // Forced to do so for some Map constructor param mismatch
  const values = ArrayPrototypeSlice(StringPrototypeSplit(value, ";"), 1);
  for (let i = 0; i < values.length; i++) {
    const entries = StringPrototypeSplit(StringPrototypeTrim(values[i]), "=");
    if (entries.length > 1) {
      MapPrototypeSet(
        params,
        entries[0],
        StringPrototypeReplace(entries[1], QUOTE_CONTENT_PATTERN, "$1"),
      );
    }
  }
  return params;
}

/**
 * Decodes a string containing UTF-8 mistakenly decoded as Latin-1 and
 * decodes it correctly.
 * @param {string} latin1String
 * @returns {string}
 */
function decodeLatin1StringAsUtf8(latin1String) {
  const buffer = new Uint8Array(latin1String.length);
  for (let i = 0; i < latin1String.length; i++) {
    buffer[i] = StringPrototypeCharCodeAt(latin1String, i);
  }
  return core.decode(buffer);
}

const CRLF = "\r\n";
const LF = StringPrototypeCodePointAt(CRLF, 1);
const CR = StringPrototypeCodePointAt(CRLF, 0);

class MultipartParser {
  /**
   * @param {Uint8Array} body
   * @param {string | undefined} boundary
   */
  constructor(body, boundary) {
    if (!boundary) {
      throw new TypeError(
        "Cannot construct MultipartParser: multipart/form-data must provide a boundary",
      );
    }

    this.boundary = `--${boundary}`;
    this.body = body;
    this.boundaryChars = core.encode(this.boundary);
  }

  /**
   * @param {string} headersText
   * @returns {{ headers: Headers, disposition: Map<string, string> }}
   */
  #parseHeaders(headersText) {
    const headers = new Headers();
    const rawHeaders = StringPrototypeSplit(headersText, "\r\n");
    for (let i = 0; i < rawHeaders.length; ++i) {
      const rawHeader = rawHeaders[i];
      const sepIndex = StringPrototypeIndexOf(rawHeader, ":");
      if (sepIndex < 0) {
        continue; // Skip this header
      }
      const key = StringPrototypeSlice(rawHeader, 0, sepIndex);
      const value = StringPrototypeSlice(rawHeader, sepIndex + 1);
      headers.set(key, value);
    }

    const disposition = parseContentDisposition(
      headers.get("Content-Disposition") ?? "",
    );

    return { headers, disposition };
  }

  /**
   * @returns {FormData}
   */
  parse() {
    // To have fields body must be at least 2 boundaries + \r\n + --
    // on the last boundary.
    if (this.body.length < (this.boundary.length * 2) + 4) {
      const decodedBody = core.decode(this.body);
      const lastBoundary = this.boundary + "--";
      // check if it's an empty valid form data
      if (
        decodedBody === lastBoundary ||
        decodedBody === lastBoundary + "\r\n"
      ) {
        return new FormData();
      }
      throw new TypeError("Unable to parse body as form data");
    }

    const formData = new FormData();
    let headerText = "";
    let boundaryIndex = 0;
    let state = 0;
    let fileStart = 0;

    for (let i = 0; i < this.body.length; i++) {
      const byte = this.body[i];
      const prevByte = this.body[i - 1];
      const isNewLine = byte === LF && prevByte === CR;

      if (state === 1) {
        headerText += StringFromCharCode(byte);
      }

      if (state === 0 && isNewLine) {
        state = 1;
      } else if (
        state === 1
      ) {
        if (
          isNewLine && this.body[i + 1] === CR &&
          this.body[i + 2] === LF
        ) {
          // end of the headers section
          state = 2;
          fileStart = i + 3; // After \r\n
        }
      } else if (state === 2) {
        if (this.boundaryChars[boundaryIndex] !== byte) {
          boundaryIndex = 0;
        } else {
          boundaryIndex++;
        }

        if (boundaryIndex >= this.boundary.length) {
          const { headers, disposition } = this.#parseHeaders(headerText);
          const content = TypedArrayPrototypeSubarray(
            this.body,
            fileStart,
            i - boundaryIndex - 1,
          );
          // https://fetch.spec.whatwg.org/#ref-for-dom-body-formdata
          // These are UTF-8 decoded as if it was Latin-1.
          // TODO(@andreubotella): Maybe we shouldn't be parsing entry headers
          // as Latin-1.
          const latin1Filename = MapPrototypeGet(disposition, "filename");
          const latin1Name = MapPrototypeGet(disposition, "name");

          state = 3;
          // Reset
          boundaryIndex = 0;
          headerText = "";

          if (!latin1Name) {
            continue; // Skip, unknown name
          }

          const name = decodeLatin1StringAsUtf8(latin1Name);
          if (latin1Filename) {
            const blob = new Blob([content], {
              type: headers.get("Content-Type") || "application/octet-stream",
            });
            formData.append(
              name,
              blob,
              decodeLatin1StringAsUtf8(latin1Filename),
            );
          } else {
            formData.append(name, core.decode(content));
          }
        }
      } else if (state === 3 && isNewLine) {
        state = 1;
      }
    }

    return formData;
  }
}

/**
 * @param {Uint8Array} body
 * @param {string | undefined} boundary
 * @returns {FormData}
 */
function parseFormData(body, boundary) {
  const parser = new MultipartParser(body, boundary);
  return parser.parse();
}

/**
 * @param {FormDataEntry[]} entries
 * @returns {FormData}
 */
function formDataFromEntries(entries) {
  const fd = new FormData();
  fd[entryList] = entries;
  return fd;
}

webidl.converters["FormData"] = webidl
  .createInterfaceConverter("FormData", FormDataPrototype);

export {
  FormData,
  formDataFromEntries,
  FormDataPrototype,
  formDataToBlob,
  parseFormData,
};
