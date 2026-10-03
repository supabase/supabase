import { add } from "./math.wasm";

const three = add(1, 2) === 3;

export default {
  fetch() {
    return new Response(three ? "meow" : "woem");
  },
};
