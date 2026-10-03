let arr: Uint8Array[] = [];
while (true) {
  arr.push(new Uint8Array(100000));
}

Deno.serve(async (_req) => {
  console.log(arr.length);
  return new Response("meow");
});
