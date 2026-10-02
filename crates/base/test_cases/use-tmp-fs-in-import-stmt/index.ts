await Deno.writeTextFile(
  "/tmp/meowmeow.ts",
  `
    import { meow } from "/tmp/meowmeow2.ts";
    export { meow }
`,
);

await Deno.writeTextFile(
  "/tmp/meowmeow2.ts",
  `
    export function meow() {
        return "meowmeow"
    }
`,
);

const module = await import("/tmp/meowmeow.ts");

console.log(module);
console.log(module.meow());
