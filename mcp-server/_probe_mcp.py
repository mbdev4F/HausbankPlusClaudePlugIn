import json
import urllib.error
import urllib.request

body = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "diag", "version": "0.0.1"},
    },
}
data = json.dumps(body).encode("utf-8")
req = urllib.request.Request(
    "https://hausbank-plus-mcp.vercel.app/api/mcp",
    data=data,
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        print("STATUS", r.status)
        print("HEADERS", dict(r.headers))
        print("RAW", raw)
        print("TEXT", raw.decode("utf-8", errors="replace"))
except urllib.error.HTTPError as e:
    raw = e.read()
    print("STATUS", e.code)
    print("HEADERS", dict(e.headers))
    print("RAW", raw)
    print("TEXT", raw.decode("utf-8", errors="replace"))
    # if looks like csv of ordinals, decode
    try:
        text = raw.decode("utf-8")
        if text[:10].replace(",", "").isdigit() or text.startswith("123,"):
            chars = "".join(chr(int(x)) for x in text.split(",") if x.strip().isdigit())
            print("DECODED", chars)
    except Exception as ex:
        print("decode fail", ex)
except Exception as e:
    print("ERR", type(e), e)
