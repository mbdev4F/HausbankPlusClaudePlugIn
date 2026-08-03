import type { ReactNode } from "react";

export const metadata = {
  title: "DB CB-Connect MCP",
  description: "Remote MCP connector for Deutsche Bank CB-Connect",
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
