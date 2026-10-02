console.log("main function started");

export default {
  fetch(req: Request) {
    console.log(req.url);

    const url = new URL(req.url);
    const { pathname } = url;
    const path_parts = pathname.split("/");
    const service_name = path_parts[1];
    const s3FsConfig = {
      appName: Deno.env.get("S3FS_TEST_APP_NAME") || "meowmeow",
      endpointUrl: Deno.env.get("S3FS_TEST_ENDPOINT_URL"),
      forcePathStyle: !!Deno.env.get("S3FS_TEST_ENDPOINT_URL"),
      region: Deno.env.get("S3FS_TEST_REGION"),
      credentials: {
        accessKeyId: Deno.env.get("S3FS_TEST_ACCESS_KEY_ID"),
        secretAccessKey: Deno.env.get("S3FS_TEST_SECRET_ACCESS_KEY"),
      },
      retryConfig: {
        mode: "standard",
      },
    } as const;

    if (!Deno.env.get("S3FS_TEST_BUCKET_NAME")) {
      return Response.json({ msg: "no bucket name were found for s3fs test" }, {
        status: 500,
      });
    }

    if (
      !s3FsConfig.credentials.accessKeyId ||
      !s3FsConfig.credentials.secretAccessKey
    ) {
      return Response.json({ msg: "no credentials were found for s3fs test" }, {
        status: 500,
      });
    }

    if (!service_name || service_name === "") {
      const error = { msg: "missing function name in request" };
      return new Response(
        JSON.stringify(error),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const servicePath = `./tests/fixture/${service_name}`;
    console.error(`serving the request with ${servicePath}`);

    const createWorker = async () => {
      const memoryLimitMb = 150;
      const workerTimeoutMs = 10 * 60 * 1000;
      const cpuTimeSoftLimitMs = 10 * 60 * 1000;
      const cpuTimeHardLimitMs = 10 * 60 * 1000;
      const noModuleCache = true;
      const envVarsObj = Deno.env.toObject();
      const envVars = Object.keys(envVarsObj).map((k) => [k, envVarsObj[k]]);

      return await EdgeRuntime.userWorkers.create({
        servicePath,
        memoryLimitMb,
        workerTimeoutMs,
        cpuTimeSoftLimitMs,
        cpuTimeHardLimitMs,
        noModuleCache,
        envVars,
        s3FsConfig,
        context: {
          useReadSyncFileAPI: true,
        },
      });
    };

    const callWorker = async () => {
      try {
        const worker = await createWorker();
        return await worker.fetch(req);
      } catch (e) {
        console.error(e);

        // if (e instanceof Deno.errors.WorkerRequestCancelled) {
        // 	return await callWorker();
        // }

        const error = { msg: e.toString() };
        return new Response(
          JSON.stringify(error),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    };

    return callWorker();
  },
};
