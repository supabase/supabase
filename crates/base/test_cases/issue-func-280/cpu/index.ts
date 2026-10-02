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

let keep = true;

async function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

setInterval(() => {
  if (keep) {
    mySlowFunction(10);
  }
}, 800);

addEventListener("beforeunload", () => {
  keep = false;
  while (true) {
    mySlowFunction(10);
    console.log("cpu");
  }
});

const never = new Promise(() => {});
EdgeRuntime.waitUntil(never);

Deno.serve((_req) => new Response("Hello, world"));
