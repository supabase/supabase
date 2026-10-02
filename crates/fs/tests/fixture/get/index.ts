export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    const sync = url.searchParams.get("sync") == "true";
    const bucketName = Deno.env.get("S3FS_TEST_BUCKET_NAME")!;
    const key = url.pathname.split("/").slice(2).join("/");

    try {
      if (sync) {
        return new Response(Deno.readFileSync(`/s3/${bucketName}/${key}`), {
          status: 200,
        });
      } else {
        const f = await Deno.open(`/s3/${bucketName}/${key}`);
        return new Response(f.readable, { status: 200 });
      }
    } catch (e) {
      console.error(e);
      return Response.json({ msg: e.toString() }, { status: 500 });
    }
  },
};
