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

export default {
  async fetch() {
    await sleep(1000 * 30);
    return new Response();
  },
};
