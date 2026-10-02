const http = require("http");

console.log(require);

const server = http.createServer((_, resp) => {
  resp.writeHead(200, {
    "content-type": "text-plain",
  });
  resp.write("meow");
  resp.end();
});

server.listen(8080);
