const meowFile = await Deno.create("/tmp/meow");

export default {
  async fetch() {
    const resp = await fetch("https://httpbin.org/stream/20");
    const body = resp.body!;

    await body.pipeTo(meowFile.writable);

    const hadExisted = await exists("/tmp/a/b/../../meow");
    const path = await Deno.realPath("/tmp/a/b/c/../../../meow");

    return Response.json({
      hadExisted,
      path,
    });
  },
};

async function exists(path: string) {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}
