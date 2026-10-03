// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { internals, primordials } from "ext:core/mod.js";
import { op_http_websocket_accept_header } from "ext:core/ops";
const {
  ArrayPrototypeIncludes,
  ArrayPrototypeMap,
  ArrayPrototypePush,
  StringPrototypeCharCodeAt,
  StringPrototypeSplit,
  StringPrototypeToLowerCase,
  StringPrototypeToUpperCase,
  TypeError,
  Symbol,
} = primordials;
import { toInnerRequest } from "ext:deno_fetch/23_request.js";
import {
  fromInnerResponse,
  newInnerResponse,
} from "ext:deno_fetch/23_response.js";
import { setEventTargetData } from "ext:deno_web/02_event.js";
import {
  _eventLoop,
  _idleTimeoutDuration,
  _idleTimeoutTimeout,
  _protocol,
  _readyState,
  _rid,
  _role,
  _server,
  _serverHandleIdleTimeout,
  createWebSocketBranded,
  WebSocket,
} from "ext:deno_websocket/01_websocket.js";

const _ws = Symbol("[[associated_ws]]");

const websocketCvf = buildCaseInsensitiveCommaValueFinder("websocket");
const upgradeCvf = buildCaseInsensitiveCommaValueFinder("upgrade");

function upgradeWebSocket(request, options = { __proto__: null }) {
  const inner = toInnerRequest(request);
  const upgrade = request.headers.get("upgrade");
  const upgradeHasWebSocketOption = upgrade !== null &&
    websocketCvf(upgrade);
  if (!upgradeHasWebSocketOption) {
    throw new TypeError(
      "Invalid Header: 'upgrade' header must contain 'websocket'",
    );
  }

  const connection = request.headers.get("connection");
  const connectionHasUpgradeOption = connection !== null &&
    upgradeCvf(connection);
  if (!connectionHasUpgradeOption) {
    throw new TypeError(
      "Invalid Header: 'connection' header must contain 'Upgrade'",
    );
  }

  const websocketKey = request.headers.get("sec-websocket-key");
  if (websocketKey === null) {
    throw new TypeError(
      "Invalid Header: 'sec-websocket-key' header must be set",
    );
  }

  const accept = op_http_websocket_accept_header(websocketKey);

  const r = newInnerResponse(101);
  r.headerList = [
    ["upgrade", "websocket"],
    ["connection", "Upgrade"],
    ["sec-websocket-accept", accept],
  ];

  const protocolsStr = request.headers.get("sec-websocket-protocol") || "";
  const protocols = StringPrototypeSplit(protocolsStr, ", ");
  if (protocols && options.protocol) {
    if (ArrayPrototypeIncludes(protocols, options.protocol)) {
      ArrayPrototypePush(r.headerList, [
        "sec-websocket-protocol",
        options.protocol,
      ]);
    } else {
      throw new TypeError(
        `Protocol '${options.protocol}' not in the request's protocol list (non negotiable)`,
      );
    }
  }

  const socket = createWebSocketBranded(WebSocket);
  setEventTargetData(socket);
  socket[_server] = true;
  // Nginx timeout is 60s, so default to a lower number: https://github.com/denoland/deno/pull/23985
  socket[_idleTimeoutDuration] = options.idleTimeout ?? 30;
  socket[_idleTimeoutTimeout] = null;

  if (inner._wantsUpgrade) {
    return inner._wantsUpgrade("upgradeWebSocket", r, socket);
  }

  const response = fromInnerResponse(r, "immutable");

  response[_ws] = socket;

  return { response, socket };
}

const spaceCharCode = StringPrototypeCharCodeAt(" ", 0);
const tabCharCode = StringPrototypeCharCodeAt("\t", 0);
const commaCharCode = StringPrototypeCharCodeAt(",", 0);

/** Builds a case function that can be used to find a case insensitive
 * value in some text that's separated by commas.
 *
 * This is done because it doesn't require any allocations.
 * @param checkText {string} - The text to find. (ex. "websocket")
 */
function buildCaseInsensitiveCommaValueFinder(checkText) {
  const charCodes = ArrayPrototypeMap(
    StringPrototypeSplit(
      StringPrototypeToLowerCase(checkText),
      "",
    ),
    (c) => [
      StringPrototypeCharCodeAt(c, 0),
      StringPrototypeCharCodeAt(StringPrototypeToUpperCase(c), 0),
    ],
  );
  /** @type {number} */
  let i;
  /** @type {number} */
  let char;

  /** @param {string} value */
  return function (value) {
    for (i = 0; i < value.length; i++) {
      char = StringPrototypeCharCodeAt(value, i);
      skipWhitespace(value);

      if (hasWord(value)) {
        skipWhitespace(value);
        if (i === value.length || char === commaCharCode) {
          return true;
        }
      } else {
        skipUntilComma(value);
      }
    }

    return false;
  };

  /** @param value {string} */
  function hasWord(value) {
    for (let j = 0; j < charCodes.length; ++j) {
      const { 0: cLower, 1: cUpper } = charCodes[j];
      if (cLower === char || cUpper === char) {
        char = StringPrototypeCharCodeAt(value, ++i);
      } else {
        return false;
      }
    }
    return true;
  }

  /** @param value {string} */
  function skipWhitespace(value) {
    while (char === spaceCharCode || char === tabCharCode) {
      char = StringPrototypeCharCodeAt(value, ++i);
    }
  }

  /** @param value {string} */
  function skipUntilComma(value) {
    while (char !== commaCharCode && i < value.length) {
      char = StringPrototypeCharCodeAt(value, ++i);
    }
  }
}

// Expose this function for unit tests
internals.buildCaseInsensitiveCommaValueFinder =
  buildCaseInsensitiveCommaValueFinder;

export { _ws, upgradeWebSocket };
