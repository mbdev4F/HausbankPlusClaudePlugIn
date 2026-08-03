import { randomUUID } from "crypto";

export type CbConnectInstantPaymentBuildInput = {
  paymentInformationId: string;
  debtorName: string;
  debtorIban: string;
  debtorBic: string;
  creditorName: string;
  creditorIban: string;
  creditorBic: string;
  amount: number;
  currency: string;
  endToEndIdentification: string;
  instructionIdentification?: string;
  executionDate?: string;
};

function compactGuid(): string {
  return randomUUID().replace(/[-{}]/g, "").slice(0, 35);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** pain.001-ähnlicher Body wie Cash365 DbCbConApi.getInstantPaymentJson */
export function buildCbConnectInstantPaymentBody(
  input: CbConnectInstantPaymentBuildInput
): Record<string, unknown> {
  const currency = (input.currency || "EUR").trim().toUpperCase() || "EUR";
  const executionDate = input.executionDate?.trim() || todayIsoDate();
  const instructionId =
    input.instructionIdentification?.trim().slice(0, 35) ||
    compactGuid().slice(0, 35);

  return {
    customerCreditTransferInitiation: {
      groupHeader: {
        messageIdentification: compactGuid(),
        creationDateTime: new Date().toISOString(),
        controlSum: input.amount,
        numberOfTransactions: "1",
        initiatingParty: {
          name: input.debtorName.trim().slice(0, 70),
        },
      },
      paymentInformation: [
        {
          paymentInformationIdentification: input.paymentInformationId
            .trim()
            .slice(0, 35),
          paymentMethod: "TRF",
          batchBooking: false,
          controlSum: input.amount,
          numberOfTransactions: "1",
          paymentTypeInformation: {
            serviceLevel: { code: "SEPA" },
            localInstrument: { code: "INST" },
          },
          requestedExecutionDate: { date: executionDate },
          debtor: {
            name: input.debtorName.trim().slice(0, 70),
          },
          debtorAccount: {
            identification: { iban: input.debtorIban.replace(/\s/g, "").toUpperCase() },
            currency,
          },
          debtorAgent: {
            financialInstitutionIdentification: {
              bicfi: input.debtorBic.replace(/\s/g, "").toUpperCase(),
            },
          },
          creditTransferTransactionInformation: [
            {
              paymentIdentification: {
                endToEndIdentification: input.endToEndIdentification
                  .trim()
                  .slice(0, 35),
                instructionIdentification: instructionId,
              },
              amount: {
                instructedAmount: {
                  currency,
                  value: input.amount,
                },
              },
              creditor: {
                name: input.creditorName.trim().slice(0, 70),
              },
              creditorAccount: {
                identification: {
                  iban: input.creditorIban.replace(/\s/g, "").toUpperCase(),
                },
                currency,
              },
              creditorAgent: {
                financialInstitutionIdentification: {
                  bicfi: input.creditorBic.replace(/\s/g, "").toUpperCase(),
                },
              },
            },
          ],
        },
      ],
    },
  };
}

export function formatCbConnectInstantPaymentJson(
  input: CbConnectInstantPaymentBuildInput
): string {
  return JSON.stringify(buildCbConnectInstantPaymentBody(input));
}

export type CbConnectInstantPaymentStatusInput = {
  debtorIban: string;
  endToEndIdentification: string;
};

export function buildCbConnectInstantPaymentStatusBody(
  input: CbConnectInstantPaymentStatusInput
): Record<string, unknown> {
  return {
    debtorAccount: {
      identification: {
        iban: input.debtorIban.replace(/\s/g, "").toUpperCase(),
      },
    },
    endToEndIdentification: input.endToEndIdentification.trim().slice(0, 35),
  };
}

export function formatCbConnectInstantPaymentStatusJson(
  input: CbConnectInstantPaymentStatusInput
): string {
  return JSON.stringify(buildCbConnectInstantPaymentStatusBody(input));
}
