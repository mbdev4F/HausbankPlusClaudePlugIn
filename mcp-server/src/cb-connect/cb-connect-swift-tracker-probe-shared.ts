export type SwiftTrackerProbeScenario =
  | "uetr"
  | "timeWindowNext"
  | "timeWindowCreditor";

export type SwiftTrackerProbeParams = {
  branchIdentifier: string;
  clientBic: string;
  accountIdentifier: string;
  serviceLevel: string;
  uetr: string;
  next: string;
  startDateTime: string;
  endDateTime: string;
  creditorAccount: string;
  maximumNumber: string;
};

export type SwiftTrackerScenarioMeta = {
  id: SwiftTrackerProbeScenario;
  label: string;
  description: string;
};

export const SWIFT_TRACKER_PROBE_SCENARIOS: SwiftTrackerScenarioMeta[] = [
  {
    id: "uetr",
    label: "UETR Search",
    description: "OAuth — Zahlungsstatus per UETR",
  },
  {
    id: "timeWindowNext",
    label: "Time Window (Next)",
    description: "OAuth — Paginierung mit next-Token",
  },
  {
    id: "timeWindowCreditor",
    label: "Time Window + Creditor Account",
    description: "OAuth — Zeitfenster-Suche mit creditorAccount",
  },
];

export function defaultSwiftTrackerProbeParams(
  scenario: SwiftTrackerProbeScenario
): SwiftTrackerProbeParams {
  const base: SwiftTrackerProbeParams = {
    branchIdentifier: "deutdeff",
    clientBic: "deutdeff",
    serviceLevel: "G007",
    uetr: "97ed4827-7b6f-4491-a06f-b548d5a7512e",
    next: "payment23412",
    startDateTime: "2025-06-04T00:00:00Z",
    endDateTime: "2025-06-09T00:00:00Z",
    creditorAccount: "22215730140990575300",
    maximumNumber: "2",
    accountIdentifier: "22215730140990575300",
  };

  if (scenario === "timeWindowNext") {
    return { ...base, accountIdentifier: "33315730140990575300" };
  }

  return base;
}

export function buildSwiftTrackerProbeBody(
  scenario: SwiftTrackerProbeScenario,
  params: SwiftTrackerProbeParams
): string {
  const serviceLevel = params.serviceLevel.trim() || "G007";

  if (scenario === "uetr") {
    return JSON.stringify({
      uetr: params.uetr.trim(),
      serviceLevel,
    });
  }

  if (scenario === "timeWindowNext") {
    return JSON.stringify({
      next: params.next.trim(),
      serviceLevel,
    });
  }

  return JSON.stringify({
    startDateTime: params.startDateTime.trim(),
    endDateTime: params.endDateTime.trim(),
    serviceLevel,
    creditorAccount: params.creditorAccount.trim(),
    maximumNumber: params.maximumNumber.trim(),
  });
}

export function resolveSwiftTrackerProbeUrl(oauthUrl: string): string {
  return oauthUrl.trim();
}
