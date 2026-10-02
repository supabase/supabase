Deno.serve(async (_req) => {
  let arr: Uint8Array[] = [];

  while (true) {
    arr.push(new Uint8Array(100000));
  }

  console.log(arr.length);
  return new Response("meow");
});
