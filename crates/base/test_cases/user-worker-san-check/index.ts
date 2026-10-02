function checkBlocklisted(list: string[]) {
  for (const api of list) {
    console.log(api);
    if (Deno[api] === void 0) {
      continue;
    }

    if (typeof Deno[api] !== "function") {
      throw new Error(`invalid api: ${api}`);
    }

    try {
      Deno[api]();
      throw new Error(`unreachable: ${api}`);
    } catch (ex) {
      if (ex instanceof Deno.errors.PermissionDenied) {
        continue;
      } else if (ex instanceof TypeError) {
        if (ex.message === "called MOCK_FN") {
          continue;
        }
      }
    }

    throw new Error(`invalid api: ${api}`);
  }
}

function checkWhitelisted(list: string[]) {
  for (const api of list) {
    console.log(api);
    if (Deno[api] === void 0) {
      continue;
    }

    if (typeof Deno[api] !== "function") {
      throw new Error(`invalid api: ${api}`);
    }

    try {
      Deno[api]();
      throw new Error(`unreachable: ${api}`);
    } catch (ex) {
      if (ex instanceof Deno.errors.PermissionDenied) {
        throw ex;
      }
    }
  }
}

const blocklist: string[] = Deno.readTextFileSync(".blocklisted")
  .trim()
  .split("\n");
const whitelisted: string[] = Deno.readTextFileSync(".whitelisted")
  .trim()
  .split("\n");

checkBlocklisted(blocklist);
checkWhitelisted(whitelisted);

const { promise: fence, resolve, reject } = Promise.withResolvers<void>();

setTimeout(() => {
  try {
    checkBlocklisted(whitelisted);
    resolve();
  } catch (ex) {
    reject(ex);
  }
});

await fence;

export {};
