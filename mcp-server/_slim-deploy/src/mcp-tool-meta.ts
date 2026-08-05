/**
 * Directory-submission helpers: human title + MCP tool annotations.
 * Anthropic requires title + readOnlyHint or destructiveHint on every tool.
 */

export type RawToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  title?: string;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
  };
};

export type AnnotatedTool = RawToolDef & {
  title: string;
  annotations: {
    title: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint: boolean;
  };
};

function humanTitle(name: string): string {
  if (name === "ping") return "Ping";
  const bare = name
    .replace(/^hausbank_agent_/, "")
    .replace(/^finapi_/, "");
  return bare
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Read-only vs write/destructive for Claude auto-permissions. */
export function isReadOnlyTool(name: string): boolean {
  if (name === "ping") return true;
  if (/_(list|get|probe)(_|$)/.test(name)) return true;
  if (name.includes("get_auth_page") || name.includes("get_bank_confirmation")) {
    return true;
  }
  if (name.endsWith("_read_request")) return true;
  return false;
}

export function annotateTool(tool: RawToolDef): AnnotatedTool {
  const title = tool.title ?? humanTitle(tool.name);
  const readOnly = isReadOnlyTool(tool.name);
  return {
    ...tool,
    title,
    annotations: {
      title,
      openWorldHint: true,
      ...(readOnly
        ? { readOnlyHint: true }
        : { destructiveHint: true }),
      ...tool.annotations,
    },
  };
}

export function annotateTools(tools: RawToolDef[]): AnnotatedTool[] {
  return tools.map(annotateTool);
}
