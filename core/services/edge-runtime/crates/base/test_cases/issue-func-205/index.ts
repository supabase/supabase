import { FFmpeg } from "npm:@ffmpeg.wasm/main";
import {
  default as core,
  type FFmpegCoreConstructor,
} from "npm:@ffmpeg.wasm/core-st";

const ff = await FFmpeg.create({
  core: core as FFmpegCoreConstructor,
});

Deno.serve(async (_req) => {
  const resp = await fetch(
    "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm",
  );
  const buf = new Uint8Array(await resp.arrayBuffer());

  ff.fs.writeFile("meow.webm", buf);

  await ff.run("-i", "meow.webm", "meow.mp4");
  const data = ff.fs.readFile("meow.mp4");

  return new Response(data, {
    headers: {
      "content-type": "video/mp4",
    },
  });
});
