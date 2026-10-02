import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

import _process from "node:process";

const generateRandomString = (length) => {
  const buffer = randomBytes(length);
  return buffer.toString("hex");
};

const randomString = generateRandomString(10);
console.log(randomString);

const server = createServer((_req, res) => {
  const message =
    `Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, inventor and explorer, every teacher of morals, every corrupt politician, every 'superstar,' every 'supreme leader,' every saint and sinner in the history of our species lived there-on a mote of dust suspended in a sunbeam.`;
  res.end(message);
});

server.listen(9999);
