/**
 * Turns whatever the visitor typed ("acme.com", "https://www.acme.com/") into a safe, absolute URL.
 *
 * Security: the server fetches this URL, so we refuse local and private network addresses.
 * Otherwise someone could make our server request internal services (an attack called SSRF).
 * Note: this checks the hostname only; it does not resolve DNS, which is acceptable for a demo.
 */
export function normalizeInputUrl(input: string): URL {
  let value = input.trim();
  if (!value) throw new Error("Please enter a website address.");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("That doesn't look like a valid website address.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https websites can be audited.");
  }
  const host = url.hostname.toLowerCase();
  if (isBlockedHost(host)) throw new Error("That address points to a private or local network.");
  if (!host.includes(".")) throw new Error("Please enter a full domain, like example.com.");
  if (url.username || url.password) throw new Error("Website addresses with logins can't be audited.");

  url.hash = "";
  return url;
}

function isBlockedHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.startsWith("[")) return true; // IPv6 literals such as [::1]

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/** "www.acme.com" and "acme.com" count as the same site. */
export function siteKey(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}
