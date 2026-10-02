// @ts-ignore
import { STATUS_CODE } from "https://deno.land/std/http/status.ts";

Deno.serve(async (req: Request) => {
  const params = new URL(req.url).searchParams;
  const model = params.get("model");
  const session = new Supabase.ai.Session(model ?? "llama2");
  let prompt = params.get("prompt");
  if (!prompt) throw new Error("prompt missing");
  const stream = params.get("stream") === "true" ?? false;
  const controller = new AbortController();
  const signal = AbortSignal.any([
    // req.signal,
    // NOTE(Nyannyacha): Abort signal in the request phase doesn't yet support.
    //
    // Backgrounds:
    // [1]: https://github.com/denoland/deno/issues/21653#issuecomment-2096544782
    // [2]: https://github.com/denoland/deno/issues/21590#issuecomment-2096544187
    // [3]: https://github.com/denoland/deno/pull/23425
    controller.signal,
  ]);

  let mode = params.get("mode") ?? "ollama";

  switch (mode) {
    case "openaicompatible":
      prompt = JSON.parse(prompt);
      break;

    case "ollama":
    default: {
      mode = "ollama";
    }
  }
  console.log({ prompt });

  if (stream) {
    const output = await session.run(prompt, {
      stream,
      mode,
      signal,
    }) as AsyncGenerator<any>;

    const body = new ReadableStream({
      async pull(ctrl) {
        try {
          const item = await output.next();

          if (item.done) {
            console.log("done");
            ctrl.close();
            return;
          }

          ctrl.enqueue("data: ");
          ctrl.enqueue(JSON.stringify(item.value));
          ctrl.enqueue("\r\n\r\n");
        } catch (err) {
          console.error(err);
          ctrl.close();
          controller.abort();
        }
      },

      async cancel() {
        console.log("body.cancel");
        controller.abort();

        for await (const _ of output) {
          // must be draining responses here to abort the backend llama request.
        }
      },
    });

    return new Response(
      body.pipeThrough(new TextEncoderStream()),
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      },
    );
  } else {
    try {
      const output = await session.run(prompt, {
        stream,
        mode,
        signal,
      });

      console.log("done");
      return Response.json(output);
    } catch (err) {
      console.error(err);
      return new Response(null, {
        status: STATUS_CODE.InternalServerError,
      });
    }
  }
});

/* To invoke locally:
Ollama Test:

curl --get "http://localhost:9998/supa-ai-openaicompatible" \
--data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" \
--data-urlencode "stream=true" \
-H "Authorization: $ANON_KEY"

LLamafile OpenAI Compatible Test (need to set AI_INFERENCE_API_HOST=http://localhost:8080)

curl --get "http://localhost:9998/supa-ai-openaicompatible" \
--data-urlencode "model=LLaMA_CPP" \
--data-urlencode 'prompt={"messages":[{"role":"user","content":"Tell me a joke about Supabase!"}]}' \
--data-urlencode "stream=true" \
--data-urlencode "mode=openaicompatible" \
-H "Authorization: $ANON_KEY"

*/
