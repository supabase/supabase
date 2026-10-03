const apis = {
  twemoji: (code: string) =>
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/" +
    code.toLowerCase() + ".svg",
  openmoji: "https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/",
  blobmoji: "https://cdn.jsdelivr.net/npm/@svgmoji/blob@2.0.0/svg/",
  noto:
    "https://cdn.jsdelivr.net/gh/svgmoji/svgmoji/packages/svgmoji__noto/svg/",
  fluent: (code: string) =>
    "https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/" +
    code.toLowerCase() + "_color.svg",
  fluentFlat: (code: string) =>
    "https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/" +
    code.toLowerCase() + "_flat.svg",
};

export type EmojiType = keyof typeof apis;

const n = String.fromCharCode(8205), O = /\uFE0F/g;

export function loadEmoji(
  code: string,
  type?: EmojiType,
): Promise<Response> {
  (!type || !apis[type]) && (type = "twemoji");
  const A = apis[type];
  return fetch(
    typeof A == "function" ? A(code) : `${A}${code.toUpperCase()}.svg`,
  );
}

export function getIconCode(char: string): string {
  return d(char.indexOf(n) < 0 ? char.replace(O, "") : char);
}

function d(j: string) {
  const t = [];
  let A = 0, k = 0;
  for (let E = 0; E < j.length;) {
    A = j.charCodeAt(E++),
      k
        ? (t.push((65536 + (k - 55296 << 10) + (A - 56320)).toString(16)),
          k = 0)
        : 55296 <= A && A <= 56319
        ? k = A
        : t.push(A.toString(16));
  }
  return t.join("-");
}
