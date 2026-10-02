const meowFile = await Deno.create("/tmp/meow");
const meow = new TextEncoder().encode("meowmeow");
await meowFile.write(meow);

const meowRealPath = Deno.realPathSync("/tmp/meow");
const meowFileContent = await Deno.readTextFile(meowRealPath);
const isValid = meowFileContent == "meowmeow";

export default {
  fetch() {
    return new Response(null, {
      status: isValid ? 200 : 500,
    });
  },
};
