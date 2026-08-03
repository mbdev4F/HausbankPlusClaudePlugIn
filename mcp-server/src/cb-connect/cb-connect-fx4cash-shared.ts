/**
 * Deutsche Bank CB-Connect — FX4Cash (cross-border) Zahlungsinitiierung.
 * Positiver Sandbox-Fall (pain.001 / customerCreditTransferInitiation).
 */

export type Fx4CashInitiationParams = {
  messageIdentification?: string;
  creationDateTime?: string;
  controlSum?: number;
  initiatingPartyName?: string;
  initiatingPartyBic?: string;
  paymentInformationIdentification?: string;
  requestedExecutionDate?: string;
  debtorName?: string;
  debtorAccountId?: string;
  debtorAccountCurrency?: string;
  debtorAgentBic?: string;
  debtorAgentName?: string;
  debtorCountry?: string;
  debtorDepartment?: string;
  debtorSubDepartment?: string;
  debtorStreetName?: string;
  debtorBuildingNumber?: string;
  debtorPostCode?: string;
  debtorTownName?: string;
  debtorCountrySubDivision?: string;
  debtorAddressLine?: string;
  debtorAgentAddressLine?: string;
  endToEndIdentification?: string;
  instructionIdentification?: string;
  instructedAmount?: number;
  instructedCurrency?: string;
  creditorName?: string;
  creditorIban?: string;
  /** Konto-ID (other), wenn keine IBAN — z. B. MX-Sandbox-Fall. */
  creditorAccountId?: string;
  creditorAccountCurrency?: string;
  creditorCountry?: string;
  creditorDepartment?: string;
  creditorSubDepartment?: string;
  creditorStreetName?: string;
  creditorBuildingNumber?: string;
  creditorPostCode?: string;
  creditorTownName?: string;
  creditorCountrySubDivision?: string;
  creditorAddressLine?: string;
  creditorCountryOfResidence?: string;
  creditorContactName?: string;
  creditorContactEmail?: string;
  creditorAgentBic?: string;
  creditorAgentName?: string;
  creditorAgentCountry?: string;
  creditorAgentAddressLine?: string;
  creditorBranchName?: string;
  remittanceUnstructured?: string;
  relatedRemittanceMethod?: string;
  relatedRemittanceElectronicAddress?: string;
};

/** Feste Sandbox-IDs aus DB-Referenz-curl (positiver Fall). */
export const FX4CASH_SANDBOX_MESSAGE_ID =
  "110674e6615fac4e3cab3079f72f4c5ce1";
export const FX4CASH_SANDBOX_PAYMENT_INFO_ID =
  "1138c658f7e9bd4199be9aa897ebf78ede";
export const FX4CASH_SANDBOX_INSTRUCTION_ID = "SSR2510310102701";

/** Sandbox-Referenzparameter (editierbar im Konfigurations-Probe-Panel). */
export function defaultFx4CashProbeParams(
  now = new Date()
): Fx4CashInitiationParams {
  const iso = now.toISOString();
  const dateOnly = iso.slice(0, 10);

  return {
    messageIdentification: FX4CASH_SANDBOX_MESSAGE_ID,
    creationDateTime: iso,
    controlSum: 1000,
    initiatingPartyName: "SCHENKER INTERNATIONAL (US) LTD",
    initiatingPartyBic: "BKTRUS33XXX",
    paymentInformationIdentification: FX4CASH_SANDBOX_PAYMENT_INFO_ID,
    requestedExecutionDate: dateOnly,
    debtorName: "SCHENKER INTERNATIONAL (US) LTD",
    debtorAccountId: "00458265",
    debtorAccountCurrency: "USD",
    debtorAgentBic: "BKTRUS33XXX",
    debtorAgentName: "Deutsche Bank AG",
    debtorCountry: "US",
    debtorDepartment: "dept",
    debtorSubDepartment: "subDept",
    debtorStreetName: "street",
    debtorBuildingNumber: "buildingNumber",
    debtorPostCode: "code",
    debtorTownName: "Franklin",
    debtorCountrySubDivision: "string",
    debtorAddressLine: "9 Ctetg Dfwely Zjdrzc",
    debtorAgentAddressLine: "Beverly Hills NY",
    instructionIdentification: FX4CASH_SANDBOX_INSTRUCTION_ID,
    instructedAmount: 1000,
    instructedCurrency: "XPF",
    creditorName: "A/C HOLDER 2700656",
    creditorIban: "FR7689327848987391472158075",
    creditorAccountCurrency: "XPF",
    creditorCountry: "PF",
    creditorTownName: "Beverly Hills",
    creditorAddressLine: "Example Corp",
    creditorCountryOfResidence: "PF",
    creditorContactName: "John Doe",
    creditorContactEmail: "john.doe@example.com",
    creditorAgentBic: "CCFRFRPPXXX",
    creditorAgentName: "HSBC",
    creditorAgentCountry: "PF",
    creditorAgentAddressLine: "Example Corp",
    creditorBranchName: "Main Branch",
    remittanceUnstructured: "Export of goods",
    relatedRemittanceMethod: "URID",
    relatedRemittanceElectronicAddress: "https://www.db.com",
  };
}

/** Sandbox-Referenz SGD→MXN (SCHENKER Singapore / DEUTSGSGXXX). */
export function defaultFx4CashSingaporeDollarProbeParams(
  now = new Date()
): Fx4CashInitiationParams {
  const iso = now.toISOString();
  const dateOnly = iso.slice(0, 10);

  return {
    messageIdentification: FX4CASH_SANDBOX_MESSAGE_ID,
    creationDateTime: iso,
    controlSum: 1000,
    initiatingPartyName: "SCHENKER INTERNATIONAL (SG) LTD",
    initiatingPartyBic: "DEUTSGSGXXX",
    paymentInformationIdentification: FX4CASH_SANDBOX_PAYMENT_INFO_ID,
    requestedExecutionDate: dateOnly,
    debtorName: "SCHENKER INTERNATIONAL (SG) LTD",
    debtorAccountId: "2699130-00-0",
    debtorAccountCurrency: "SGD",
    debtorAgentBic: "DEUTSGSGXXX",
    debtorAgentName: "Deutsche Bank AG",
    debtorCountry: "SG",
    debtorDepartment: "dept",
    debtorSubDepartment: "subDept",
    debtorStreetName: "street",
    debtorBuildingNumber: "buildingNumber",
    debtorPostCode: "code",
    debtorTownName: "Singapore",
    debtorCountrySubDivision: "string",
    debtorAddressLine: "9 Ctetg Dfwely Zjdrzc",
    debtorAgentAddressLine: "Beverly Hills Singapore",
    instructionIdentification: FX4CASH_SANDBOX_INSTRUCTION_ID,
    instructedAmount: 1000,
    instructedCurrency: "MXN",
    creditorName: "A/C HOLDER 2700656",
    creditorAccountId: "002665000000000001",
    creditorAccountCurrency: "MXN",
    creditorCountry: "MX",
    creditorTownName: "Beverly Hills",
    creditorAddressLine: "Example Corp",
    creditorCountryOfResidence: "MX",
    creditorContactName: "John Doe",
    creditorContactEmail: "john.doe@example.com",
    creditorAgentBic: "HSBCHKHHXXX",
    creditorAgentName: "HSBC",
    creditorAgentCountry: "MX",
    creditorAgentAddressLine: "Example Corp",
    creditorBranchName: "Main Branch",
    remittanceUnstructured: "Export of goods",
    relatedRemittanceMethod: "URID",
    relatedRemittanceElectronicAddress: "https://www.db.com",
  };
}
