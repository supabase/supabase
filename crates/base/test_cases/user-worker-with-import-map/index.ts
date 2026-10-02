import * as path from "jsr:@std/path";

Deno.serve(async (req: Request) => {
  const basePath = "test_cases/user-worker-with-import-map";
  const url = new URL(req.url);
  const { pathname } = url;

  const userWorkerPath = path.join(basePath, "user_worker");
  if (pathname === "/import_map") {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: userWorkerPath,
      forceCreate: true,
      context: {
        importMapPath: path.join(basePath, "import_map.json"),
      },
    });
    return worker.fetch(req);
  }
  if (pathname === "/inline_import_map") {
    const inlineImportMap = {
      imports: {
        "helper-from-import-map": `./${path.join(basePath, "helper.ts")}`,
      },
    };
    const importMapPath = `data:${
      encodeURIComponent(JSON.stringify(inlineImportMap))
    }`;

    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: userWorkerPath,
      forceCreate: true,
      context: {
        importMapPath: importMapPath,
      },
    });
    return worker.fetch(req);
  }

  return new Response("Not Found", { status: 404 });
});
