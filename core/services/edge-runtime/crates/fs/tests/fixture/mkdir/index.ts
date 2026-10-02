export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    const bucketName = Deno.env.get("S3FS_TEST_BUCKET_NAME")!;
    const recursive = url.searchParams.get("recursive") === "true";
    const key = url.pathname.split("/").slice(2).join("/");

    try {
      await Deno.mkdir(`/s3/${bucketName}/${key}`, { recursive });
    } catch (e) {
      console.error(e);
      return Response.json({ msg: e.toString() }, { status: 500 });
    }

    return new Response(null, { status: 200 });
  },
};
