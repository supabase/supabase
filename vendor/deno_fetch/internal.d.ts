// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any no-var

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />

declare var domIterable: {
  DomIterableMixin(base: any, dataSymbol: symbol): any;
};

declare module "ext:deno_fetch/20_headers.js" {
  class Headers {
  }
  type HeaderList = [string, string][];
  function headersFromHeaderList(
    list: HeaderList,
    guard:
      | "immutable"
      | "request"
      | "request-no-cors"
      | "response"
      | "none",
  ): Headers;
  function headerListFromHeaders(headers: Headers): HeaderList;
  function fillHeaders(headers: Headers, object: HeadersInit): void;
  function getDecodeSplitHeader(
    list: HeaderList,
    name: string,
  ): string[] | null;
  function guardFromHeaders(
    headers: Headers,
  ): "immutable" | "request" | "request-no-cors" | "response" | "none";
}

declare module "ext:deno_fetch/21_formdata.js" {
  type FormData = typeof FormData;
  function formDataToBlob(
    formData: FormData,
  ): Blob;
  function parseFormData(
    body: Uint8Array,
    boundary: string | undefined,
  ): FormData;
  function formDataFromEntries(entries: FormDataEntry[]): FormData;
}

declare module "ext:deno_fetch/22_body.js" {
  function mixinBody(
    prototype: any,
    bodySymbol: symbol,
    mimeTypeSymbol: symbol,
  ): void;
  class InnerBody {
    constructor(stream?: ReadableStream<Uint8Array>);
    stream: ReadableStream<Uint8Array>;
    source: null | Uint8Array | Blob | FormData;
    length: null | number;
    unusable(): boolean;
    consume(): Promise<Uint8Array>;
    clone(): InnerBody;
  }
  function extractBody(object: BodyInit): {
    body: InnerBody;
    contentType: string | null;
  };
}

declare module "ext:deno_fetch/26_fetch.js" {
  function toInnerRequest(request: Request): InnerRequest;
  function fromInnerRequest(
    inner: InnerRequest,
    guard:
      | "request"
      | "immutable"
      | "request-no-cors"
      | "response"
      | "none",
    skipBody: boolean,
  ): Request;
  function redirectStatus(status: number): boolean;
  function nullBodyStatus(status: number): boolean;
  function newInnerRequest(
    method: string,
    url: any,
    headerList?: [string, string][],
    body?: fetchBody.InnerBody,
  ): InnerResponse;
  function toInnerResponse(response: Response): InnerResponse;
  function fromInnerResponse(
    inner: InnerResponse,
    guard:
      | "request"
      | "immutable"
      | "request-no-cors"
      | "response"
      | "none",
  ): Response;
  function networkError(error: string): InnerResponse;
}
