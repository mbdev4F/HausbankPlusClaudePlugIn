import type { ReactNode } from "react";

export const metadata = {
  title: "HausbankAgent",
  description: "Remote MCP connector: finAPI + Hausbank-Agent",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem" }}>
        {children}
      </body>
    </html>
  );
}
