# Zertifikate & Signierung

## Sandbox / Dev

`CBCON_CERTIFICATEBASE64` + `CBCON_CERTIFICATEPASSWORD` (PKCS#12).  
Bei TLS-Problemen: `CBCON_TLS_INSECURE=true`.

## Produktion

Azure Key Vault (`AZURE_KEY_VAULT_URL` + Managed Identity oder SP).  
Signing: `src/azure-key-vault/signing.ts` + `cb-connect-keyvault-signer.ts`.

Private Keys nicht dauerhaft auf Disk in Production ablegen.
