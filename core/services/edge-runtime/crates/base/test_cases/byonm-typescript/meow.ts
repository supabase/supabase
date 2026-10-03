import isodd from "is-odd";
import { createServer } from "node:http";

class Meow {
  private meow: boolean;

  constructor(odd: number) {
    this.meow = isodd(odd);
  }

  getMeow() {
    return this.meow;
  }
}

const server = createServer((_, resp) => {
  const meow = new Meow(33);
  resp.writeHead(200, {
    "content-type": "text-plain",
  });
  resp.write(meow.getMeow() ? "meow" : "meow!!");
  resp.end();
});

server.listen(8080);
