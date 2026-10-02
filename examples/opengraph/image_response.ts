import type { ReactElement } from "https://esm.sh/react@18.2.0";
import type { SatoriOptions } from "https://esm.sh/satori@0.0.46";

import satori, { init as initSatori } from "https://esm.sh/satori@0.0.46/wasm";
import { initStreaming } from "https://esm.sh/yoga-wasm-web@0.3.0";

import {
  initWasm,
  Resvg,
} from "https://esm.sh/@resvg/resvg-wasm@2.0.0-alpha.4";
import { EmojiType, getIconCode, loadEmoji } from "./emoji.ts";

declare module "https://esm.sh/react@18.2.0" {
  interface HTMLAttributes<T> {
    /**
     * Specify styles using Tailwind CSS classes. This feature is currently experimental.
     * If `style` prop is also specified, styles generated with `tw` prop will be overridden.
     *
     * Example:
     * - `tw='w-full h-full bg-blue-200'`
     * - `tw='text-9xl'`
     * - `tw='text-[80px]'`
     *
     * @type {string}
     */
    tw?: string;
  }
}

const resvg_wasm = fetch(
  "https://cdn.jsdelivr.net/npm/@vercel/og@0.0.25/vendor/resvg.simd.wasm",
).then((res) => res.arrayBuffer());

const yoga_wasm = fetch(
  "https://cdn.jsdelivr.net/npm/@vercel/og@0.0.25/vendor/yoga.wasm",
);

const fallbackFont = fetch(
  "https://cdn.jsdelivr.net/npm/@vercel/og@0.0.25/vendor/noto-sans-v27-latin-regular.ttf",
).then((a) => a.arrayBuffer());

const initializedResvg = initWasm(resvg_wasm);
const initializedYoga = initStreaming(yoga_wasm).then((yoga: unknown) =>
  initSatori(yoga)
);

const isDev = Boolean(Deno.env.get("NETLIFY_LOCAL"));

type ImageResponseOptions = ConstructorParameters<typeof Response>[1] & {
  /**
   * The width of the image.
   *
   * @type {number}
   * @default 1200
   */
  width?: number;
  /**
   * The height of the image.
   *
   * @type {number}
   * @default 630
   */
  height?: number;
  /**
   * Display debug information on the image.
   *
   * @type {boolean}
   * @default false
   */
  debug?: boolean;
  /**
   * A list of fonts to use.
   *
   * @type {{ data: ArrayBuffer; name: string; weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style?: 'normal' | 'italic' }[]}
   * @default Noto Sans Latin Regular.
   */
  fonts?: SatoriOptions["fonts"];
  /**
   * Using a specific Emoji style. Defaults to `twemoji`.
   *
   * @link https://github.com/vercel/og#emoji
   * @type {EmojiType}
   * @default 'twemoji'
   */
  emoji?: EmojiType;
};

// @TODO: Support font style and weights, and make this option extensible rather
// than built-in.
// @TODO: Cover most languages with Noto Sans.
const languageFontMap = {
  "ja-JP": "Noto+Sans+JP",
  "ko-KR": "Noto+Sans+KR",
  "zh-CN": "Noto+Sans+SC",
  "zh-TW": "Noto+Sans+TC",
  "zh-HK": "Noto+Sans+HK",
  "th-TH": "Noto+Sans+Thai",
  "bn-IN": "Noto+Sans+Bengali",
  "ar-AR": "Noto+Sans+Arabic",
  "ta-IN": "Noto+Sans+Tamil",
  "ml-IN": "Noto+Sans+Malayalam",
  "he-IL": "Noto+Sans+Hebrew",
  "te-IN": "Noto+Sans+Telugu",
  devanagari: "Noto+Sans+Devanagari",
  kannada: "Noto+Sans+Kannada",
  symbol: ["Noto+Sans+Symbols", "Noto+Sans+Symbols+2"],
  math: "Noto+Sans+Math",
  unknown: "Noto+Sans",
};

async function loadGoogleFont(fonts: string | string[], text: string) {
  // @TODO: Support multiple fonts.
  const font = Array.isArray(fonts) ? fonts.at(-1) : fonts;
  if (!font || !text) return;

  const API = `https://fonts.googleapis.com/css2?family=${font}&text=${
    encodeURIComponent(
      text,
    )
  }`;

  const css = await (
    await fetch(API, {
      headers: {
        // Make sure it returns TTF.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text();

  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );
  if (!resource) throw new Error("Failed to load font");

  return fetch(resource[1]).then((res) => res.arrayBuffer());
}

type Asset = SatoriOptions["fonts"][0] | string;

const assetCache = new Map<string, Asset | undefined>();
const loadDynamicAsset = ({ emoji }: { emoji?: EmojiType }) => {
  const fn = async (
    code: keyof typeof languageFontMap | "emoji",
    text: string,
  ): Promise<Asset | undefined> => {
    if (code === "emoji") {
      // It's an emoji, load the image.
      return (
        `data:image/svg+xml;base64,` +
        btoa(await (await loadEmoji(getIconCode(text), emoji)).text())
      );
    }

    // Try to load from Google Fonts.
    if (!languageFontMap[code]) code = "unknown";

    try {
      const data = await loadGoogleFont(languageFontMap[code], text);

      if (data) {
        return {
          name: `satori_${code}_fallback_${text}`,
          data,
          weight: 400,
          style: "normal",
        };
      }
    } catch (e) {
      console.error("Failed to load dynamic font for", text, ". Error:", e);
    }
  };

  return async (...args: Parameters<typeof fn>) => {
    const key = JSON.stringify(args);
    const cache = assetCache.get(key);
    if (cache) return cache;

    const asset = await fn(...args);
    assetCache.set(key, asset);
    return asset;
  };
};

export class ImageResponse extends Response {
  constructor(element: ReactElement, options: ImageResponseOptions = {}) {
    const extendedOptions = Object.assign(
      {
        width: 1200,
        height: 630,
        debug: false,
      },
      options,
    );

    const result = new ReadableStream({
      async start(controller) {
        try {
          console.log("init yoga wasm");
          const fetchRes = await yoga_wasm;
          console.log(fetchRes);
          const res = await WebAssembly.instantiateStreaming(fetchRes);
          console.log(res);
        } catch (e) {
          console.log("error in init yoga");
          console.log(e);
        }

        await initializedYoga;
        await initializedResvg;
        const fontData = await fallbackFont;

        const svg = await satori(element, {
          width: extendedOptions.width,
          height: extendedOptions.height,
          debug: extendedOptions.debug,
          fonts: extendedOptions.fonts || [
            {
              name: "sans serif",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ],
          loadAdditionalAsset: loadDynamicAsset({
            emoji: extendedOptions.emoji,
          }),
        });

        const resvgJS = new Resvg(svg, {
          fitTo: {
            mode: "width",
            value: extendedOptions.width,
          },
        });

        const res = resvgJS.render();
        console.log(res);
        controller.enqueue(svg);
        controller.close();
      },
    });
    console.log("result is ready");
    console.log(result);

    super(result, {
      headers: {
        "content-type": "image/png",
        "cache-control": isDev
          ? "no-cache, no-store"
          : "public, max-age=31536000, no-transform, immutable",
        ...extendedOptions.headers,
      },
      status: extendedOptions.status,
      statusText: extendedOptions.statusText,
    });
  }
}
