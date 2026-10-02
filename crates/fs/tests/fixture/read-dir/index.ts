export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    const bucketName = Deno.env.get("S3FS_TEST_BUCKET_NAME")!;
    const key = url.pathname.split("/").slice(2).join("/");

    try {
      const entries = await Deno.readDir(`/s3/${bucketName}/${key}`);
      const result = [];

      for await (const entry of entries) {
        result.push(entry);
      }

      return Response.json(result);
    } catch (e) {
      console.error(e);
      return Response.json({ msg: e.toString() }, { status: 500 });
    }
  },
};
