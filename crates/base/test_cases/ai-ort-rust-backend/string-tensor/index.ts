import { assertExists, assertInstanceOf } from "jsr:@std/assert";

// @ts-ignore: No types for 'onnxruntime' symbol
const { Tensor, InferenceSession } = globalThis[Symbol.for("onnxruntime")];

const modelUrl =
  "https://huggingface.co/pirocheto/phishing-url-detection/resolve/main/model.onnx?download=true";

const encoder = new TextEncoder();
const modelUrlBuffer = encoder.encode(modelUrl);
const session = await InferenceSession.create(modelUrlBuffer);

Deno.serve(async (_req: Request) => {
  const urls = [
    "https://clubedemilhagem.com/home.php",
    "http://www.medicalnewstoday.com/articles/188939.php",
    "https://magalu-crediarioluiza.com/Produto_20203/produto.php?sku=1",
  ];

  const inputs = new Tensor("string", urls, [urls.length]);
  const output = await session.run({ inputs });

  // just need to make sure that model output something
  // we don't care about the predicts values
  assertExists(output.label);
  assertExists(output.probabilities);

  assertInstanceOf(output.label, Tensor);
  assertInstanceOf(output.probabilities, Tensor);

  return new Response();
});
