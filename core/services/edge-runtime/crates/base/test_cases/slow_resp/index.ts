Deno.serve(async (req: Request) => {
  // NOTE(Nyannyacha): This should be hot enough to V8 decides JIT compilation.

  let nothing = req.method === "POST" ? await req.text() : "";

  if (req.method === "POST") {
    console.log(nothing);
  }

  const before = performance.now();
  const num = mySlowFunction(11);
  const after = performance.now();

  console.log(`time: ${after - before}ms`);

  return new Response(
    `meow: ${num} (${after - before})`,
    {
      status: 200,
    },
  );
});

function mySlowFunction(baseNumber) {
  let result = 0;
  for (var i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i);
  }
  return result;
}
