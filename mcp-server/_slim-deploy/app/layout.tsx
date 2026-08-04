import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ fontFamily: "system-ui", margin: "2rem" }}>{children}</body>
    </html>
  );
}
