async function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

Deno.serve(async () => {
  await sleep(5000);
  return new Response("meow");
});
