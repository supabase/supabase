function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(void 0);
    }, ms);
  });
}

addEventListener("beforeunload", (ev) => {
  console.log(ev.detail);
});

export default {
  async fetch() {
    await sleep(2000);
    return new Response();
  },
};
