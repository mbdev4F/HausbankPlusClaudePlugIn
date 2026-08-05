"use client";

import { useState } from "react";

type Lang = "de" | "en";

const copy = {
  de: {
    badge: "Dokumentation",
    title: "HausbankAgent",
    lead:
      "Verbinde Claude mit deinem eigenen ERP-Banking über Microsoft Entra. Ein Connector, viele Mandanten — ohne Client-Secret beim Endnutzer.",
    connectTitle: "Verbinden in Claude",
    connectSteps: [
      "Settings → Connectors → Custom Connector hinzufügen (oder Directory).",
      "URL: https://hausbank-plus-mcp.vercel.app/api/mcp",
      "Name: HausbankAgent",
      "Environment-Name eingeben (z. B. Production) und optional Company-GUID.",
      "Mit Microsoft anmelden. Einmalig ggf. Admin-Consent im Tenant.",
    ],
    needTitle: "Voraussetzungen",
    needItems: [
      "Microsoft-Arbeitskonto mit Zugriff auf eure Firma",
      "Environment-Name wie in eurem ERP hinterlegt",
      "Company-GUID (nach Login per Tool listbar)",
    ],
    examplesTitle: "Beispiel-Prompts",
    examplesIntro:
      "Formuliere klar, was du willst — Claude wählt die passenden hausbank_agent_*-Tools.",
    sections: [
      {
        h: "Einstieg & Diagnose",
        prompts: [
          "Prüfe, ob meine HausbankAgent-Verbindung steht und welcher Tenant aktiv ist.",
          "Liste alle Companies und nenne mir die GUIDs.",
        ],
        tools: "probe_auth, list_companies",
      },
      {
        h: "Konten & Salden",
        prompts: [
          "Liste alle Bankkonten inkl. Salden für meine Company.",
          "Zeige Details zum Konto mit der IBAN DE89…",
          "Aktualisiere die Kontodaten von der Bank (Update from bank).",
        ],
        tools: "list_accounts, get_account, update_from_bank",
      },
      {
        h: "Kreditoren & Debitoren",
        prompts: [
          "Liste die ersten 20 Kreditoren und filter nach Name Müller.",
          "Lege einen neuen Kreditor mit Name, IBAN und BIC an.",
          "Ändere die IBAN des Kreditors mit dieser ID.",
        ],
        tools: "list/get/create/update_vendor, list/get/create/update_customer",
      },
      {
        h: "Zahlungen (ERP, ohne Bankversand)",
        prompts: [
          "Zeige offene Zahlungen und deren Status.",
          "Erstelle einen Payment-Entwurf: 250 EUR an Kreditor X, Verwendungszweck Rechnung 1042.",
          "Genehmige die Zahlung mit dieser Payment-ID.",
          "Öffne die Zahlung wieder, falls sie noch nicht freigegeben werden soll.",
        ],
        tools: "list/get/create/update/delete/approve/reopen_payment",
      },
      {
        h: "Umsätze & Kontoauszüge",
        prompts: [
          "Liste die letzten Transaktionen für Konto Y.",
          "Erstelle einen Statement-Datensatz und zeige den Status.",
          "Lade CAMT-XML für diesen Statement.",
        ],
        tools: "list_transactions, list/create/get_statement, load_camt_xml",
      },
      {
        h: "SWIFT / G4C Suche",
        prompts: [
          "Lege eine G4C-Suche an und starte die SWIFT-Abfrage.",
          "Liste G4C-Payments für diese UETR.",
        ],
        tools: "create_g4c_search, run_g4c_swift_search, list_g4c_payments",
      },
    ],
    tipTitle: "Tipp",
    tipBody:
      "Bankversand und Payment-Links sind in dieser Directory-Version absichtlich nicht enthalten. Genehmigen und Pflegen von Payments in eurem ERP ist möglich.",
    whyTitle: "Warum Microsoft Business Central + HausbankAgent?",
    whyLead:
      "Mit Microsoft Business Central in der Azure Cloud betreiben Sie eine hochgesicherte Banking-Umgebung, die ein vollständiges Banking-Erlebnis mit einem durchgängigen API-Stack verbindet — und genau darauf dockt HausbankAgent als MCP an.",
    whyPoints: [
      "Reine Banking- und Multibank-APIs sind heute oft Ordering-Plattformen: sie eignen sich zum Auslösen von Aufträgen, greifen historische Daten aber nur schwer und begrenzt ab.",
      "Business Central als cloudgetriebene Anwendung mit Datenbank hält Zahlungen, Kontoauszüge und Transaktionsdaten so lange vor, wie Sie es wünschen — inklusive Freigaben im Vier-Augen-Prinzip, Entwürfen (Draft-Pages) und steuerbaren Benutzerrechten.",
      "So nutzen Claude und andere LLMs einen deutlich größeren, strukturierten Datenschatz als Bank- oder Multibank-APIs allein bereitstellen können — inkl. Kreditoren, Debitoren, Konten, Statements und Zahlungshistorie.",
      "EDI und Bankenschnittstellen lassen sich so weit wie möglich ausschöpfen: das ERP orchestriert, die Bank führt aus — HausbankAgent macht diesen Stack für KI-Assistenten steuerbar.",
      "Zielgruppe SME und Midcap: ein Banking-Connector für diesen Bereich, der seinesgleichen sucht.",
    ],
    marketplaceCta: "App im Microsoft Marketplace ansehen (Cash365 / Banqr)",
    privacy: "Datenschutz",
    home: "Start",
  },
  en: {
    badge: "Documentation",
    title: "HausbankAgent",
    lead:
      "Connect Claude to your own ERP banking stack via Microsoft Entra. One connector, many tenants — end users never paste a client secret.",
    connectTitle: "Connect in Claude",
    connectSteps: [
      "Settings → Connectors → Add custom connector (or Directory).",
      "URL: https://hausbank-plus-mcp.vercel.app/api/mcp",
      "Name: HausbankAgent",
      "Enter Environment name (e.g. Production) and optional Company GUID.",
      "Sign in with Microsoft. Admin consent may be required once per tenant.",
    ],
    needTitle: "What you need",
    needItems: [
      "Microsoft work account with access to your company",
      "Environment name as configured in your ERP",
      "Company GUID (listable via tool after login)",
    ],
    examplesTitle: "Example prompts",
    examplesIntro:
      "Say clearly what you want — Claude picks the matching hausbank_agent_* tools.",
    sections: [
      {
        h: "Setup & diagnostics",
        prompts: [
          "Check whether my HausbankAgent session is healthy and which tenant is active.",
          "List all companies and show their GUIDs.",
        ],
        tools: "probe_auth, list_companies",
      },
      {
        h: "Accounts & balances",
        prompts: [
          "List all bank accounts including balances for my company.",
          "Show details for the account with IBAN DE89…",
          "Refresh account data from the bank (update from bank).",
        ],
        tools: "list_accounts, get_account, update_from_bank",
      },
      {
        h: "Vendors & customers",
        prompts: [
          "List the first 20 vendors and filter by name Müller.",
          "Create a vendor with name, IBAN and BIC.",
          "Update the IBAN for this vendor id.",
        ],
        tools: "list/get/create/update_vendor, list/get/create/update_customer",
      },
      {
        h: "Payments (ERP only — no bank send)",
        prompts: [
          "Show open payments and their status.",
          "Create a payment draft: EUR 250 to vendor X, remittance invoice 1042.",
          "Approve the payment with this payment id.",
          "Reopen the payment if it should not be released yet.",
        ],
        tools: "list/get/create/update/delete/approve/reopen_payment",
      },
      {
        h: "Transactions & statements",
        prompts: [
          "List recent transactions for account Y.",
          "Create a statement record and show its status.",
          "Load CAMT XML for this statement.",
        ],
        tools: "list_transactions, list/create/get_statement, load_camt_xml",
      },
      {
        h: "SWIFT / G4C search",
        prompts: [
          "Create a G4C search and run the SWIFT query.",
          "List G4C payments for this UETR.",
        ],
        tools: "create_g4c_search, run_g4c_swift_search, list_g4c_payments",
      },
    ],
    tipTitle: "Note",
    tipBody:
      "Bank send and payment-link tools are intentionally omitted in this Directory build. Approving and maintaining payments inside your ERP remains available.",
    whyTitle: "Why Microsoft Business Central + HausbankAgent?",
    whyLead:
      "Running Microsoft Business Central in the Azure cloud gives you a highly secure banking environment that combines a full banking experience with a complete API stack — and HausbankAgent exposes that stack to Claude via MCP.",
    whyPoints: [
      "Pure banking and multibank APIs are often ordering platforms today: strong at initiating instructions, weak at retrieving deep historical data.",
      "Business Central as a cloud application with a database retains payments, statements and transaction history for as long as you need — with four-eyes approvals, draft pages and fine-grained user rights.",
      "Claude and other LLMs can therefore work on a much richer, structured data treasure than bank or multibank APIs alone can provide — vendors, customers, accounts, statements and payment history included.",
      "EDI and bank interfaces can be leveraged as far as possible: the ERP orchestrates, the bank executes — HausbankAgent makes that stack operable for AI assistants.",
      "Built for SME and mid-cap: a banking connector in this segment that stands apart.",
    ],
    marketplaceCta: "View the app on Microsoft Marketplace (Cash365 / Banqr)",
    privacy: "Privacy",
    home: "Home",
  },
} as const;

const MARKETPLACE_URL =
  "https://marketplace.microsoft.com/en-us/product/dynamics-365-business-central/PUBID.19403%7CAID.cash365_banqr%7CPAPPID.5ff52c8b-d8df-4325-b7f7-49bbe271a340?tab=Overview";


export default function DocsPage() {
  const [lang, setLang] = useState<Lang>("de");
  const t = copy[lang];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#dceade_0%,_transparent_55%),linear-gradient(160deg,#f3f6f2_0%,#e7efe9_45%,#f7f4ee_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-moss/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-8">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-moss">
              {t.badge}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-forest-deep sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              {t.lead}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-line bg-card/80 p-1 shadow-sm backdrop-blur">
            {(["de", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  lang === code
                    ? "bg-forest text-white"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-4 text-sm font-medium text-moss">
          <a className="hover:underline" href="/">
            {t.home}
          </a>
          <a className="hover:underline" href="/privacy">
            {t.privacy}
          </a>
        </nav>

        <section className="mb-8 overflow-hidden rounded-2xl border border-forest/20 bg-gradient-to-br from-forest-deep to-moss text-white shadow-md">
          <div className="p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl">
              {t.whyTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
              {t.whyLead}
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/85 sm:text-[0.95rem]">
              {t.whyPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8e6d8]"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-forest-deep transition hover:bg-highlight"
            >
              {t.marketplaceCta}
              <span aria-hidden>↗</span>
            </a>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-line bg-card/90 p-6 shadow-sm backdrop-blur">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-forest-deep">
            {t.connectTitle}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-muted">
            {t.connectSteps.map((step) => (
              <li key={step}>
                {step.includes("https://") ? (
                  <>
                    {step.split("https://")[0]}
                    <code className="rounded bg-highlight px-1.5 py-0.5 text-[0.9em] text-forest">
                      https://{step.split("https://")[1]}
                    </code>
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-8 rounded-2xl border border-line bg-card/90 p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-forest-deep">
            {t.needTitle}
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-muted">
            {t.needItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-forest-deep">
            {t.examplesTitle}
          </h2>
          <p className="mt-2 text-ink-muted">{t.examplesIntro}</p>
        </section>

        <div className="space-y-5">
          {t.sections.map((section) => (
            <article
              key={section.h}
              className="rounded-2xl border border-line bg-card p-6 shadow-sm transition hover:border-moss/40"
            >
              <h3 className="font-[family-name:var(--font-display)] text-xl text-forest">
                {section.h}
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber">
                Tools: {section.tools}
              </p>
              <ul className="mt-4 space-y-3">
                {section.prompts.map((p) => (
                  <li
                    key={p}
                    className="rounded-xl border border-highlight bg-highlight/60 px-4 py-3 text-sm leading-relaxed text-ink"
                  >
                    <span className="mr-2 text-moss">„</span>
                    {p}
                    <span className="text-moss">“</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="mt-10 rounded-2xl border border-amber/30 bg-[#fff8ee] p-5 text-sm text-ink-muted">
          <p className="font-semibold text-amber">{t.tipTitle}</p>
          <p className="mt-1">{t.tipBody}</p>
        </aside>
      </div>
    </div>
  );
}
