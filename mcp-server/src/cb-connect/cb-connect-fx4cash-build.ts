import { randomUUID } from "node:crypto";
import type { Fx4CashInitiationParams } from "./cb-connect-fx4cash-shared.js";
import {
  defaultFx4CashProbeParams,
  FX4CASH_SANDBOX_INSTRUCTION_ID,
  FX4CASH_SANDBOX_MESSAGE_ID,
  FX4CASH_SANDBOX_PAYMENT_INFO_ID,
} from "./cb-connect-fx4cash-shared.js";
import { formatCbConnectApiTimestamp } from "./cb-connect-signing-core.js";

export type Fx4CashInitiationDocument = {
  customerCreditTransferInitiation: {
    groupHeader: {
      messageIdentification: string;
      creationDateTime: string;
      numberOfTransactions: number;
      controlSum: number;
      initiatingParty: {
        name: string;
        identification: {
          organisationIdentification: {
            anyBIC: string;
          };
        };
      };
    };
    paymentInformation: Array<{
      paymentInformationIdentification: string;
      paymentMethod: string;
      numberOfTransactions: number;
      batchBooking: boolean;
      controlSum: number;
      paymentTypeInformation: {
        serviceLevel: Array<{ code: string; proprietary: string }>;
      };
      requestedExecutionDate: { date: string };
      debtor: {
        name: string;
        postalAddress: {
          addressType: { code: string };
          department?: string;
          subDepartment?: string;
          streetName?: string;
          buildingNumber?: string;
          postCode?: string;
          townName?: string;
          countrySubDivision?: string;
          country: string;
          addressLine?: string[];
        };
      };
      debtorAccount: {
        identification: { other: { id: string } };
        currency: string;
      };
      debtorAgent: {
        financialInstitutionIdentification: {
          BICFI: string;
          name: string;
          postalAddress: { country: string; addressLine?: string[] };
        };
      };
      creditTransferTransactionInformation: Array<{
        paymentIdentification: {
          endToEndIdentification: string;
          instructionIdentification: string;
        };
        amount: {
          instructedAmount: { currency: string; amount: number };
        };
        creditor: {
          name: string;
          postalAddress: {
            addressType?: { code: string };
            department?: string;
            subDepartment?: string;
            streetName?: string;
            buildingNumber?: string;
            postCode?: string;
            townName?: string;
            countrySubDivision?: string;
            country: string;
            addressLine?: string[];
          };
          countryOfResidence?: string;
          contactDetails?: {
            name: string;
            emailAddress: string;
          };
        };
        creditorAccount: {
          identification:
            | { iban: string }
            | { other: { id: string } };
          currency: string;
        };
        creditorAgent: {
          financialInstitutionIdentification: {
            BICFI: string;
            name: string;
            postalAddress: { country: string; addressLine?: string[] };
          };
          branchIdentification?: { name: string };
        };
        remittanceInformation: { unstructured: string[] };
        relatedRemittanceInformation?: Array<{
          remittanceLocationDetails: Array<{
            method: string;
            electronicAddress: string;
          }>;
        }>;
      }>;
    }>;
  };
};

function mergeParams(
  overrides?: Partial<Fx4CashInitiationParams>
): Fx4CashInitiationParams {
  const base = defaultFx4CashProbeParams();
  const merged = { ...base, ...overrides };
  const now = new Date();

  return {
    ...merged,
    messageIdentification:
      merged.messageIdentification?.trim() ||
      randomUUID().replace(/-/g, ""),
    creationDateTime:
      merged.creationDateTime?.trim() || formatCbConnectApiTimestamp(now),
    controlSum: merged.controlSum ?? merged.instructedAmount ?? 0,
    paymentInformationIdentification:
      merged.paymentInformationIdentification?.trim() ||
      randomUUID().replace(/-/g, ""),
    requestedExecutionDate:
      merged.requestedExecutionDate?.trim() || now.toISOString().slice(0, 10),
    endToEndIdentification:
      merged.endToEndIdentification?.trim() ||
      randomUUID().replace(/-/g, "").slice(0, 35),
    instructionIdentification:
      merged.instructionIdentification?.trim() || FX4CASH_SANDBOX_INSTRUCTION_ID,
    debtorName: merged.debtorName?.trim() || "Debtor",
    debtorAccountId: merged.debtorAccountId?.trim() || "00000000",
    debtorAccountCurrency: merged.debtorAccountCurrency?.trim() || "EUR",
    debtorAgentBic: merged.debtorAgentBic?.trim() || "BKTRUS33XXX",
    debtorAgentName: merged.debtorAgentName?.trim() || "Deutsche Bank AG",
    debtorCountry: merged.debtorCountry?.trim() || "US",
    creditorName: merged.creditorName?.trim() || "Creditor",
    creditorIban: merged.creditorIban?.replace(/\s/g, "") || "",
    creditorAccountCurrency:
      merged.creditorAccountCurrency?.trim() || "USD",
    creditorCountry: merged.creditorCountry?.trim() || "US",
    creditorCountryOfResidence:
      merged.creditorCountryOfResidence?.trim() ||
      merged.creditorCountry?.trim() ||
      "US",
    creditorAgentBic: merged.creditorAgentBic?.trim() || "",
    creditorAgentName: merged.creditorAgentName?.trim() || "Bank",
    creditorAgentCountry:
      merged.creditorAgentCountry?.trim() || merged.creditorCountry?.trim(),
    remittanceUnstructured:
      merged.remittanceUnstructured?.trim() || "Payment",
    relatedRemittanceMethod: merged.relatedRemittanceMethod?.trim() || "URID",
    relatedRemittanceElectronicAddress:
      merged.relatedRemittanceElectronicAddress?.trim() ||
      "https://www.db.com",
  };
}

/** Exakter DB-Sandbox-Body (nur Zeitstempel / E2E dynamisch). */
export function buildFx4CashSandboxReferenceBody(
  now = new Date()
): Fx4CashInitiationDocument {
  return buildFx4CashInitiationBody(defaultFx4CashProbeParams(now));
}

export function buildFx4CashInitiationBody(
  overrides?: Partial<Fx4CashInitiationParams>
): Fx4CashInitiationDocument {
  const p = mergeParams(overrides);
  const controlSum = p.controlSum ?? p.instructedAmount ?? 0;

  const creditorPostal: NonNullable<
    Fx4CashInitiationDocument["customerCreditTransferInitiation"]["paymentInformation"][0]["creditTransferTransactionInformation"][0]["creditor"]["postalAddress"]
  > = {
    addressType: { code: "ADDR" },
    country: p.creditorCountry ?? "PF",
  };
  if (p.creditorDepartment) creditorPostal.department = p.creditorDepartment;
  if (p.creditorSubDepartment) creditorPostal.subDepartment = p.creditorSubDepartment;
  if (p.creditorStreetName) creditorPostal.streetName = p.creditorStreetName;
  if (p.creditorBuildingNumber) {
    creditorPostal.buildingNumber = p.creditorBuildingNumber;
  }
  if (p.creditorPostCode) creditorPostal.postCode = p.creditorPostCode;
  if (p.creditorTownName) creditorPostal.townName = p.creditorTownName;
  if (p.creditorCountrySubDivision) {
    creditorPostal.countrySubDivision = p.creditorCountrySubDivision;
  }
  if (p.creditorAddressLine) creditorPostal.addressLine = [p.creditorAddressLine];

  const creditorBlock: Fx4CashInitiationDocument["customerCreditTransferInitiation"]["paymentInformation"][0]["creditTransferTransactionInformation"][0]["creditor"] =
    {
      name: p.creditorName!,
      postalAddress: creditorPostal,
      countryOfResidence: p.creditorCountryOfResidence ?? p.creditorCountry,
    };
  if (p.creditorContactName && p.creditorContactEmail) {
    creditorBlock.contactDetails = {
      name: p.creditorContactName,
      emailAddress: p.creditorContactEmail,
    };
  }

  const creditorAgentBlock: Fx4CashInitiationDocument["customerCreditTransferInitiation"]["paymentInformation"][0]["creditTransferTransactionInformation"][0]["creditorAgent"] =
    {
      financialInstitutionIdentification: {
        BICFI: p.creditorAgentBic!,
        name: p.creditorAgentName || "Bank",
        postalAddress: {
          country: p.creditorAgentCountry ?? p.creditorCountry ?? "PF",
          ...(p.creditorAgentAddressLine || p.creditorAddressLine
            ? {
                addressLine: [
                  p.creditorAgentAddressLine ?? p.creditorAddressLine!,
                ],
              }
            : {}),
        },
      },
    };
  if (p.creditorBranchName) {
    creditorAgentBlock.branchIdentification = { name: p.creditorBranchName };
  }

  const creditTransfer: Fx4CashInitiationDocument["customerCreditTransferInitiation"]["paymentInformation"][0]["creditTransferTransactionInformation"][0] =
    {
      paymentIdentification: {
        endToEndIdentification: p.endToEndIdentification!,
        instructionIdentification: p.instructionIdentification!,
      },
      amount: {
        instructedAmount: {
          currency: p.instructedCurrency!,
          amount: p.instructedAmount ?? 0,
        },
      },
      creditor: creditorBlock,
      creditorAccount: p.creditorAccountId?.trim()
        ? {
            identification: { other: { id: p.creditorAccountId.trim() } },
            currency: p.creditorAccountCurrency!,
          }
        : {
            identification: { iban: p.creditorIban! },
            currency: p.creditorAccountCurrency!,
          },
      creditorAgent: creditorAgentBlock,
      remittanceInformation: {
        unstructured: [p.remittanceUnstructured!],
      },
    };

  if (p.relatedRemittanceMethod && p.relatedRemittanceElectronicAddress) {
    creditTransfer.relatedRemittanceInformation = [
      {
        remittanceLocationDetails: [
          {
            method: p.relatedRemittanceMethod,
            electronicAddress: p.relatedRemittanceElectronicAddress,
          },
        ],
      },
    ];
  }

  return {
    customerCreditTransferInitiation: {
      groupHeader: {
        messageIdentification: p.messageIdentification!,
        creationDateTime: p.creationDateTime!,
        numberOfTransactions: 1,
        controlSum,
        initiatingParty: {
          name: p.initiatingPartyName!,
          identification: {
            organisationIdentification: {
              anyBIC: p.initiatingPartyBic!,
            },
          },
        },
      },
      paymentInformation: [
        {
          paymentInformationIdentification: p.paymentInformationIdentification!,
          paymentMethod: "TRF",
          numberOfTransactions: 1,
          batchBooking: false,
          controlSum,
          paymentTypeInformation: {
            serviceLevel: [
              { code: "G001", proprietary: "PRIORITY-TRANSFER" },
            ],
          },
          requestedExecutionDate: { date: p.requestedExecutionDate! },
          debtor: {
            name: p.debtorName!,
            postalAddress: {
              addressType: { code: "ADDR" },
              department: p.debtorDepartment,
              subDepartment: p.debtorSubDepartment,
              streetName: p.debtorStreetName,
              buildingNumber: p.debtorBuildingNumber,
              postCode: p.debtorPostCode,
              townName: p.debtorTownName,
              countrySubDivision: p.debtorCountrySubDivision,
              country: p.debtorCountry ?? "US",
              addressLine: p.debtorAddressLine
                ? [p.debtorAddressLine]
                : undefined,
            },
          },
          debtorAccount: {
            identification: { other: { id: p.debtorAccountId! } },
            currency: p.debtorAccountCurrency!,
          },
          debtorAgent: {
            financialInstitutionIdentification: {
              BICFI: p.debtorAgentBic!,
              name: p.debtorAgentName!,
              postalAddress: {
                country: p.debtorCountry ?? "US",
                addressLine: p.debtorAgentAddressLine
                  ? [p.debtorAgentAddressLine]
                  : undefined,
              },
            },
          },
          creditTransferTransactionInformation: [creditTransfer],
        },
      ],
    },
  };
}

export function formatFx4CashInitiationJson(
  overrides?: Partial<Fx4CashInitiationParams>,
  options?: { sandboxReference?: boolean }
): string {
  const body = options?.sandboxReference
    ? buildFx4CashSandboxReferenceBody()
    : buildFx4CashInitiationBody(overrides);
  return JSON.stringify(body, null, 2);
}

export function formatFx4CashSandboxReferenceJson(now = new Date()): string {
  return JSON.stringify(buildFx4CashSandboxReferenceBody(now), null, 2);
}

/** Prüft, ob Params dem DB-Referenz-Szenario entsprechen (für Tests). */
export function isFx4CashSandboxReferenceParams(
  params: Partial<Fx4CashInitiationParams>
): boolean {
  return (
    params.messageIdentification === FX4CASH_SANDBOX_MESSAGE_ID &&
    params.paymentInformationIdentification === FX4CASH_SANDBOX_PAYMENT_INFO_ID
  );
}
