const source = new URL("../", import.meta.url);
const target = new URL("../../functions/_shared/email-templates/", source);
const files = [
  "mod.ts", "src/types.ts", "src/errors.ts", "src/security.ts", "src/render.ts", "src/send.ts",
  "src/catalog.generated.ts", "src/providers/resend.ts", "src/providers/webhook.ts",
];
for (const file of files) {
  const from = new URL(file, source);
  const to = new URL(file, target);
  await Deno.mkdir(new URL("./", to), { recursive: true });
  const content = await Deno.readTextFile(from);
  await Deno.writeTextFile(to, `/* GENERATED FROM supabase/templates/${file}. DO NOT EDIT. */\n${content}`);
}
console.log(`Synced ${files.length} runtime files to functions/_shared/email-templates.`);
