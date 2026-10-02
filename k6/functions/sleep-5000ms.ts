function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

await sleep(5000);

Deno.serve(() => new Response());
