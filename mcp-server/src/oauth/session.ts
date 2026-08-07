import { AsyncLocalStorage } from "async_hooks";

/** Per-request Hausbank-Agent session from Claude OAuth / Entra. */
export type HausbankSession = {
  /** Entra access token for Business Central APIs. */
  accessToken: string;
  tenantId: string;
  environmentName: string;
  companyId: string;
  oid?: string;
  name?: string;
};

export const hausbankSessionAls = new AsyncLocalStorage<HausbankSession>();

export function getHausbankSession(): HausbankSession | undefined {
  return hausbankSessionAls.getStore();
}

export function runWithHausbankSession<T>(
  session: HausbankSession,
  fn: () => T,
): T {
  return hausbankSessionAls.run(session, fn);
}
