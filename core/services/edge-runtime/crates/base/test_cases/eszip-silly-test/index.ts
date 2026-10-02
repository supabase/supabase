import isEven from "npm:is-even";

console.log("Hello A");
globalThis.isTenEven = isEven(10);
console.log("Hello");
