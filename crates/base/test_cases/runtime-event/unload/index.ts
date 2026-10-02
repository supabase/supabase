addEventListener("unload", () => {
  console.log("triggered", "unload");
});

export default {
  fetch() {
    return new Response();
  },
};
