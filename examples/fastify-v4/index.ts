import Fastify from "npm:fastify@4";

const servicePath = import.meta.dirname.split("/").at(-1);
const fastify = Fastify();

// Declare a route
fastify.get(`/${servicePath}`, function handler(_request, _reply) {
  return "Hello World!";
});

// Run the server!
await fastify.listen();
