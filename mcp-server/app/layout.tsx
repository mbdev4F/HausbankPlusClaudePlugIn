import type { ReactNode } from "react";

export const metadata = {
  title: "HausbankAgent",
  description:
    "HausbankAgent MCP — Deutsche Bank plus PSD2 Multi-Banking (~9.200 EU-Banken) über die Embedded Banking App",
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
