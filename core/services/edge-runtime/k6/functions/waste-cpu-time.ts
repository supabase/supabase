function mySlowFunction(baseNumber) {
  console.time("mySlowFunction");
  let now = Date.now();
  let result = 0;
  for (var i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i);
  }
  let duration = Date.now() - now;
  console.timeEnd("mySlowFunction");
  return { result: result, duration: duration };
}

mySlowFunction(11);

Deno.serve(() => new Response());
