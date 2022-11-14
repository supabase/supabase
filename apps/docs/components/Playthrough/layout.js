import "./global.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Quickstart: Next.js | Supabase</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
