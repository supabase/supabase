import * as cat from "@workspace/cat";
import * as dog from "@workspace/dog";
import * as sheep from "@workspace/sheep";

export default {
  fetch() {
    return new Response(JSON.stringify({
      cat: cat.say,
      dog: dog.say,
      sheep: sheep.say,
    }));
  },
};
