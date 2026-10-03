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

const mem = [];

export default {
  async fetch() {
    for (const _ of [...Array(12).keys()]) {
      const buf = new Uint8Array(1024 * 1024);
      buf.fill(1, 0);
      mem.push(buf);
      await sleep(300);
    }

    return new Response();
  },
};
