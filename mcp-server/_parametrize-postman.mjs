/**
 * Parametrize HausbankPlus CloudConnector Postman collection:
 * - hosts → {{bcBaseUrl}} / {{loginBaseUrl}}
 * - hardcoded GUIDs → env vars
 * - token/company scripts → pm.environment
 * Writes collection + empty environment to Desktop.
 */
import fs from "node:fs";
import path from "node:path";

const desktop = "c:/Users/marku/Desktop";
const src = path.join(
  desktop,
  "HausbankPlus CloudConnector Copy.postman_collection.json",
);
const outCollection = path.join(
  desktop,
  "HausbankPlus CloudConnector.parametrized.postman_collection.json",
);
const outEnv = path.join(
  desktop,
  "HausbankPlus CloudConnector.postman_environment.json",
);

const GUID_MAP = [
  {
    from: /be991151-6523-f111-8340-70a8a51630cf/gi,
    to: "{{openBankingConnectorId}}",
  },
  {
    from: /d2760fbc-aff6-f011-8405-70a8a51730fa/gi,
    to: "{{vendorId}}",
  },
  {
    from: /be06c11c-b0f6-f011-8405-70a8a51730fa/gi,
    to: "{{vendorId}}",
  },
  {
    from: /c6a4898d-aef6-f011-8405-70a8a5188193/gi,
    to: "{{customerId}}",
  },
  {
    from: /01C21811-4F6E-4192-9101-0E8050D04B89/gi,
    to: "{{uetr}}",
  },
];

function applyGuidMap(s) {
  let out = s;
  for (const { from, to } of GUID_MAP) out = out.replace(from, to);
  return out;
}

function rewriteRawUrl(raw) {
  if (!raw) return raw;
  let u = raw;
  u = u.replace(
    /https:\/\/api\.businesscentral\.dynamics\.com/gi,
    "{{bcBaseUrl}}",
  );
  u = u.replace(
    /https:\/\/login\.microsoftonline\.com/gi,
    "{{loginBaseUrl}}",
  );
  u = u.replace(/\/vendors\(\)/g, "/vendors({{vendorId}})");
  u = u.replace(/\/customers\(\)/g, "/customers({{customerId}})");
  u = applyGuidMap(u);
  return u;
}

function rebuildUrlObject(url) {
  if (!url) return url;
  if (typeof url === "string") {
    return rewriteRawUrl(url);
  }
  const raw = rewriteRawUrl(url.raw || "");
  const next = { ...url, raw };

  // Rebuild host/path from raw when possible (skip query)
  try {
    const noQuery = raw.split("?")[0];
    // {{var}} hosts aren't valid URL — parse manually
    const m = noQuery.match(/^(https?):\/\/([^/]+)(\/.*)?$/i);
    if (m) {
      next.protocol = m[1];
      next.host = m[2].split(".");
      const pathname = m[3] || "/";
      next.path = pathname.replace(/^\//, "").split("/").filter(Boolean);
    } else if (raw.startsWith("{{")) {
      // e.g. {{bcBaseUrl}}/v2.0/...
      const idx = raw.indexOf("/");
      // after first }}/
      const afterHost = raw.replace(/^\{\{[^}]+\}\}/, "");
      next.host = [raw.match(/^\{\{([^}]+)\}\}/)?.[1] || "bcBaseUrl"].map(
        (h) => `{{${h.replace(/[{}]/g, "")}}}`,
      );
      // Postman prefers host as parts without braces weirdness — keep host as single var token
      next.host = [raw.match(/^\{\{[^}]+\}\}/)?.[0] || "{{bcBaseUrl}}"];
      next.protocol = "https";
      const pathPart = afterHost.split("?")[0].replace(/^\//, "");
      next.path = pathPart ? pathPart.split("/") : [];
    }
  } catch {
    /* keep existing */
  }

  if (Array.isArray(next.path)) {
    next.path = next.path.map((seg) => applyGuidMap(String(seg)));
  }
  return next;
}

function rewriteBody(body) {
  if (!body) return body;
  const next = { ...body };
  if (typeof next.raw === "string") next.raw = applyGuidMap(next.raw);
  if (Array.isArray(next.urlencoded)) {
    next.urlencoded = next.urlencoded.map((row) => {
      const r = { ...row };
      if (r.key === "scope" && typeof r.value === "string") {
        r.value = "{{bcOAuthScope}}";
      }
      if (typeof r.value === "string") r.value = applyGuidMap(r.value);
      return r;
    });
  }
  return next;
}

function rewriteEvents(events) {
  if (!Array.isArray(events)) return events;
  return events.map((ev) => {
    if (!ev?.script?.exec) return ev;
    const exec = ev.script.exec.map((line) =>
      String(line)
        .replace(/pm\.globals\.set/g, "pm.environment.set")
        .replace(/pm\.globals\.get/g, "pm.environment.get"),
    );
    return {
      ...ev,
      script: { ...ev.script, exec },
    };
  });
}

function walkItems(items) {
  return (items || []).map((it) => {
    const next = { ...it };
    if (next.item) next.item = walkItems(next.item);
    if (next.event) next.event = rewriteEvents(next.event);
    if (next.request) {
      next.request = {
        ...next.request,
        url: rebuildUrlObject(next.request.url),
        body: rewriteBody(next.request.body),
      };
      if (Array.isArray(next.request.header)) {
        next.request.header = next.request.header.map((h) => ({
          ...h,
          value:
            typeof h.value === "string" ? applyGuidMap(h.value) : h.value,
        }));
      }
    }
    // Drop saved example responses (contain hardcoded tokens/tenant IDs)
    if (next.response) delete next.response;
    return next;
  });
}

const collection = JSON.parse(fs.readFileSync(src, "utf8"));
collection.info = {
  ...collection.info,
  name: "HausbankPlus CloudConnector (parametrized)",
  description:
    (collection.info?.description || "") +
    "\n\n---\nParametrized: use environment **HausbankPlus CloudConnector**. Fill empty values; run Meta → Get OAuth2 Token then List Companies first.\n",
};
collection.item = walkItems(collection.item);
collection.variable = [
  { key: "bcBaseUrl", value: "{{bcBaseUrl}}" },
  { key: "loginBaseUrl", value: "{{loginBaseUrl}}" },
];

const envValues = [
  // Auth / BC connection
  ["bcBaseUrl", "https://api.businesscentral.dynamics.com", "BC API host"],
  ["loginBaseUrl", "https://login.microsoftonline.com", "Entra login host"],
  ["bcOAuthScope", "https://api.businesscentral.dynamics.com/.default", "OAuth scope"],
  ["tenantId", "", "Azure AD / Entra tenant ID (from Banqr)"],
  ["environmentName", "", "BC environment name e.g. Sandbox / Production"],
  ["clientId", "", "App registration client ID (from Banqr)"],
  ["clientSecret", "", "App registration client secret (from Banqr)"],
  ["access_token", "", "Filled by Meta/Get OAuth2 Token"],
  ["companyId", "", "Filled by Meta/List Companies (or set manually)"],

  // Setup / connectors
  ["setupId", "", "Cash365 / Hausbank setup systemId"],
  ["openBankingConnectorId", "", "finAPI openBankingConnectors systemId"],
  ["certificatePassword", "", "Optional: used in Set Certificate Password body"],
  ["clientSecretValue", "", "Optional: DB client secret for Set Client Secret body"],
  ["certificateBase64", "", "Optional: P12/base64 for Set Certificate body"],

  // Master data / banking
  ["vendorId", "", "Vendor counterparty systemId"],
  ["customerId", "", "Customer counterparty systemId"],
  ["accountId", "", "Bank account systemId (GUID)"],
  ["accountNo", "", "Bank account number for transaction $filter"],
  ["parrentAccountId", "", "Physical parent account Id for virtual accounts"],
  ["statementId", "", "Statement request systemId"],
  ["paymentId", "", "Payment draft systemId"],
  ["g4cId", "", "Swift G4C search request systemId"],
  ["uetr", "", "Swift payment UETR for tracker filter"],
].map(([key, value, description]) => ({
  key,
  value,
  type: "default",
  enabled: true,
  description,
}));

const environment = {
  id: "hausbankplus-cloudconnector-env",
  name: "HausbankPlus CloudConnector",
  values: envValues,
  _postman_variable_scope: "environment",
};

fs.writeFileSync(outCollection, JSON.stringify(collection, null, 2));
fs.writeFileSync(outEnv, JSON.stringify(environment, null, 2));

// Verify remaining hardcoded GUIDs in request URLs
const guidRe =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
const leftover = [];
function check(items, path = []) {
  for (const it of items || []) {
    if (it.item) check(it.item, [...path, it.name]);
    const raw =
      typeof it.request?.url === "string"
        ? it.request.url
        : it.request?.url?.raw || "";
    const hits = raw.match(guidRe) || [];
    if (hits.length)
      leftover.push({ path: path.concat(it.name).join(" / "), hits });
  }
}
check(collection.item);

console.log(
  JSON.stringify(
    {
      outCollection,
      outEnv,
      envVarCount: envValues.length,
      leftoverHardcodedGuids: leftover,
      sampleUrls: (() => {
        const urls = [];
        function w(items) {
          for (const it of items || []) {
            if (it.item) w(it.item);
            if (it.request?.url)
              urls.push(
                typeof it.request.url === "string"
                  ? it.request.url
                  : it.request.url.raw,
              );
          }
        }
        w(collection.item);
        return urls.slice(0, 5);
      })(),
    },
    null,
    2,
  ),
);
