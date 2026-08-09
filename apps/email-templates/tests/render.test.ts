import { renderEmailTemplate } from "../mod.ts";

Deno.test("renders a production template", () => {
  const output = renderEmailTemplate("az.maint.statement_review.ar.v1", {
    recipient_name: "المهندس محمد",
    reference: "MS-2026-0042",
    details: [
      { label: "العميل", value: "أبو عوف" },
      { label: "إجمالي المستخلص", value: "125,000 جنيه" },
    ],
    action_url: "https://uberfix.alazab.com/statements/MS-2026-0042",
  });
  if (!output.subject.includes("MS-2026-0042")) throw new Error("subject reference missing");
  if (!output.html.includes("125,000 جنيه")) throw new Error("detail missing");
});

Deno.test("escapes untrusted values", () => {
  const output = renderEmailTemplate("az.azabot.ticket_created.ar.v1", {
    recipient_name: '<script>alert("x")</script>',
  });
  if (output.html.includes("<script>")) throw new Error("unsafe HTML was not escaped");
});
