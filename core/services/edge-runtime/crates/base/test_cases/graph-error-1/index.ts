// Relative import path "oak" not prefixed with / or ./ or ../
import "oak";
export default {
  fetch() {
    return new Response("meow");
  },
};
