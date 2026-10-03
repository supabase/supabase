import isOdd from "npm:is-odd@^3";
import json from "npm:is-odd@^3/package.json" with { type: "json" };

console.log(isOdd);

Deno.serve(() => new Response(json["version"]));
