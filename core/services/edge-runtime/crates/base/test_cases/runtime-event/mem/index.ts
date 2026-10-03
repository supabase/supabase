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

const arr = [];

function memHog() {
  const x = new Uint8Array(100000);
  x.fill(999, 0);
  arr.push(x);
}

export default {
  async fetch() {
    for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
      memHog();
      await sleep(10);
    }

    return new Response();
  },
};
