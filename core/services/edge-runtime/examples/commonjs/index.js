const http = require("http");
const isOdd = require("is-odd");

console.log(require);
console.log(isOdd(33));

const server = http.createServer((_, resp) => {
  resp.writeHead(200, {
    "content-type": "text-plain",
  });
  resp.write("Hello, World!\n");
  resp.end();
});

server.listen(8080);
