// Module not found "file:///.../meow.ts
import "../meow.ts";
export default {
  fetch() {
    return new Response("meow");
  },
};
