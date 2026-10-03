addEventListener("beforeunload", (ev) => {
  if (ev instanceof CustomEvent) {
    console.log("triggered", ev.detail?.["reason"]);
  }
});

function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

function mySlowFunction(baseNumber: number) {
  const now = Date.now();
  let result = 0;
  for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
    result += Math.atan(i) * Math.tan(i);
  }
  const duration = Date.now() - now;
  return { result: result, duration: duration };
}

export default {
  async fetch() {
    for (let i = 0; i < Number.MAX_VALUE; i++) {
      mySlowFunction(8);
      await sleep(10);
    }

    return new Response();
  },
};
