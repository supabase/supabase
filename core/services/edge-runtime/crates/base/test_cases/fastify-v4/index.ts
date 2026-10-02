import Fastify from "npm:fastify@4";

const servicePath = import.meta.dirname.split("/").at(-1);
const fastify = Fastify();

fastify.get(`/${servicePath}`, () => {
  return "meow";
});

await fastify.listen();
