import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge/mod.ts";

export async function handler(req: Request) {
   return new ImageResponse(
    <div
      style={{
        fontSize: 100,
        color: "black",
        background: "white",
        width: "100%",
        height: "100%",
        padding: "50px 200px",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      }}
    >
      👋, It works!
    </div>,
    {
      width: 1200,
      height: 630,
      // Supported options: 'twemoji', 'blobmoji', 'noto', 'openmoji', 'fluent', 'fluentFlat'
      // Default to 'twemoji'
      emoji: "twemoji",
    },
  );
}

