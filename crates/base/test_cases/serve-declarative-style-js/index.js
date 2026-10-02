export default {
  /**
   * @param {Request} req
   * @returns {void}
   */
  fetch(req) {
    console.log(req.headers.get("content-type"));
    return new Response("meow");
  },
};
