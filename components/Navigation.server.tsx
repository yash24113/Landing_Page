import Link from "next/link";

const stripBidi = (s: string) => s.replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
const telSan = (s: string) => {
  const t = stripBidi(String(s)).replace(/"/g, "");
  const plus = t.trim().startsWith("+") ? "+" : "";
  const digits = t.replace(/[^\d]/g, "");
  return digits ? `${plus}${digits}` : "";
};
const waSan = (s: string) => stripBidi(String(s)).replace(/[^0-9]/g, "");

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:7000/landing";
const OFFICE_INFO_URL = `${RAW_BASE}/officeinformation`;

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

type OfficeInfo = {
  companyName?: string;
  companyPhone1?: string;
  companyPhone2?: string;
  whatsappNumber?: string;
};

export default async function Navigation() {
  let companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Company Name";
  let rawPhone = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141";
  let rawWa =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_COMPANY_PHONE ||
    "+91 9925155141";

  try {
    const res = await fetch(OFFICE_INFO_URL, {
      headers: authHeaders,
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const first: OfficeInfo | undefined = Array.isArray(json?.data) ? json.data[0] : undefined;
      if (first) {
        companyName = String(first.companyName ?? companyName).trim() || companyName;
        rawPhone = String(first.companyPhone1 ?? first.companyPhone2 ?? rawPhone).trim() || rawPhone;
        rawWa = String(first.whatsappNumber ?? rawPhone ?? rawWa).trim() || rawWa;
      }
    }
  } catch {
    /* keep fallbacks */
  }

  const tel = telSan(rawPhone);
  const wa = waSan(rawWa);
  const telHref = tel ? `tel:${tel}` : undefined;
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        "Hi! I'm interested in your fabrics and need some assistance."
      )}`
    : undefined;

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b-0 sticky top-0 z-50 relative animated-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop */}
        <div className="hidden md:flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              {companyName}
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            <a href="#products" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Products</a>
            <a href="#about" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">About</a>
            <a href="#faq" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">FAQ</a>
            <a href="#contact" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Contact</a>
            <a href="#contact" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Get Quote
            </a>
          </div>
        </div>

        {/* Mobile (CSS-only with <details>) */}
        <div className="md:hidden">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-slate-900">
              {companyName}
            </Link>
            <details className="relative">
              <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-slate-100" aria-label="Open menu">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-[88vw] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-lg p-4">
                <ul className="flex flex-col gap-2">
                  <li><a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#products">Products</a></li>
                  <li><a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#about">About</a></li>
                  <li><a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#faq">FAQ</a></li>
                  <li><a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#contact">Contact</a></li>
                </ul>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <a href="#contact" className="text-center rounded-xl bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700">Get Quote</a>
                  <a
                    href={telHref || "#"}
                    aria-disabled={!telHref}
                    className="text-center rounded-xl border border-blue-400 bg-white text-blue-700 font-semibold py-3 hover:bg-blue-50"
                  >
                    Call us
                  </a>
                  <a
                    href={waHref || "#"}
                    aria-disabled={!waHref}
                    className="col-span-2 text-center rounded-xl border border-green-500 bg-green-500/10 text-green-700 font-semibold py-3 hover:bg-green-500/15"
                    target={waHref ? "_blank" : undefined}
                    rel={waHref ? "noopener noreferrer" : undefined}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
}
