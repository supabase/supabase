import http from "k6/http";

import { target } from "./config";

export function upload(content: string): string {
  const resp = http.put(`${target}/_internal/upload`, content);
  return resp.json("path") as string;
}
