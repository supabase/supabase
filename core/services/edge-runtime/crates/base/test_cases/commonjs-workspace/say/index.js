const cat = require("cat");
const dog = require("dog");

module.exports = require("http")
  .createServer((_, resp) => {
    resp.writeHead(
      200,
      {
        "content-type": "text-plain",
      },
    );
    resp.write(JSON.stringify({
      cat: cat.say,
      dog: dog.say,
    }));
    resp.end();
  });
