import postgres from "postgres";

const sql = postgres({/* options */});
console.log(sql);

export default {
  fetch() {
    return new Response(null);
  },
};
