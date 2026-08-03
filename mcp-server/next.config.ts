import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@modelcontextprotocol/sdk",
    "mcp-handler",
    "@azure/identity",
    "@azure/keyvault-certificates",
    "@azure/keyvault-keys",
    "node-forge",
  ],
  webpack: (config) => {
    // Support NodeNext-style ".js" imports that resolve to ".ts" sources.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
