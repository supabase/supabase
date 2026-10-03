# deno_fetch

**This crate implements the Fetch API.**

Spec: https://fetch.spec.whatwg.org/

## Usage Example

From javascript, include the extension's source, and assign the following
properties to the global scope:

```javascript
import * as headers from "ext:deno_fetch/20_headers.js";
import * as formData from "ext:deno_fetch/21_formdata.js";
import * as request from "ext:deno_fetch/23_request.js";
import * as response from "ext:deno_fetch/23_response.js";
import * as fetch from "ext:deno_fetch/26_fetch.js";
import * as eventSource from "ext:deno_fetch/27_eventsource.js";

// Set up the callback for Wasm streaming ops
Deno.core.setWasmStreamingCallback(fetch.handleWasmStreaming);

Object.defineProperty(globalThis, "fetch", {
  value: fetch.fetch,
  enumerable: true,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Request", {
  value: request.Request,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Response", {
  value: response.Response,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "Headers", {
  value: headers.Headers,
  enumerable: false,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "FormData", {
  value: formData.FormData,
  enumerable: false,
  configurable: true,
  writable: true,
});
```

Then from rust, provide
`deno_fetch::deno_fetch::init_ops_and_esm<Permissions>(Default::default())` in
the `extensions` field of your `RuntimeOptions`

Where:

- Permissions: a struct implementing `deno_fetch::FetchPermissions`
- Options: `deno_fetch::Options`, which implements `Default`

## Dependencies

- **deno_webidl**: Provided by the `deno_webidl` crate
- **deno_web**: Provided by the `deno_web` crate
- **deno_url**: Provided by the `deno_url` crate
- **deno_console**: Provided by the `deno_console` crate

## Provided ops

Following ops are provided, which can be accessed through `Deno.ops`:

- op_fetch
- op_fetch_send
- op_utf8_to_byte_string
- op_fetch_custom_client
