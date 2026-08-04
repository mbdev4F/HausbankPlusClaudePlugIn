export function finapiAccessPaymentStatusLabel(
  payment: { status?: string; statusV2?: string } | undefined
): string {
  return (payment?.statusV2 ?? payment?.status ?? "").toString().trim();
}

export type FinapiLocalPaymentStatus =
  | "completed"
  | "rejected"
  | "sent"
  | "pending";

export function mapFinapiAccessStatusToLocal(finapiStatus: string): {
  status: FinapiLocalPaymentStatus;
  bankTransactionStatus: string;
} {
  const s = finapiStatus.toUpperCase();
  if (s === "SUCCESSFUL") {
    return { status: "completed", bankTransactionStatus: "SUCCESSFUL" };
  }
  if (s === "NOT_SUCCESSFUL" || s === "DISCARDED") {
    return { status: "rejected", bankTransactionStatus: s };
  }
  if (s === "PENDING") {
    return { status: "sent", bankTransactionStatus: "PENDING" };
  }
  if (s === "OPEN") {
    return { status: "sent", bankTransactionStatus: "OPEN" };
  }
  return { status: "sent", bankTransactionStatus: s || "PENDING" };
}
