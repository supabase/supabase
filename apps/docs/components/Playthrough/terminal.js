import React from "react";
import { attachElement } from "./runner";

export function XTerm({ className }) {
  return <div ref={(ref) => attachElement(ref)} className={className} />;
}
