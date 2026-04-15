import { useState, useCallback } from "react";

// ── Google Font ──────────────────────────────────────────────────────────────
const FontLink = () => (
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap"
    rel="stylesheet"
  />
);

// ── Franchise Defaults ───────────────────────────────────────────────────────
const FRANCHISES = {
  "Pizza Hut":   { avgTicket: 18.50, sfMin: 1200, sfMax: 2500, royalty: 0.06,   adFee: 0.0475, franchiseFee: 25000,  buildout: 350000,  category: "QSR Pizza" },
  "Domino's":    { avgTicket: 16.00, sfMin: 1000, sfMax: 2000, royalty: 0.055,  adFee: 0.04,   franchiseFee: 25000,  buildout: 325000,  category: "QSR Pizza" },
  "Subway":      { avgTicket: 10.00, sfMin: 800,  sfMax: 1500, royalty: 0.08,   adFee: 0.045,  franchiseFee: 15000,  buildout: 200000,  category: "QSR Sandwich" },
  "McDonald's":  { avgTicket: 12.00, sfMin: 2000, sfMax: 4000, royalty: 0.04,   adFee: 0.04,   franchiseFee: 45000,  buildout: 1000000, category: "QSR Burger" },
  "Chick-fil-A": { avgTicket: 14.00, sfMin: 2500, sfMax: 5000, royalty: 0.00,   adFee: 0.00,   franchiseFee: 10000,  buildout: 500000,  category: "QSR Chicken" },
  "Custom":      { avgTicket: 15.00, sfMin: 1000, sfMax: 3000, royalty: 0.05,   adFee: 0.03,   franchiseFee: 25000,  buildout: 300000,  category: "Other" },
};
const FRANCHISE_NAMES = Object.keys(FRANCHISES);

// ── Helpers ──────────────────────────────────────────────────────────────────
const isPresent = (val) => val !== "" && val !== null && val !== undefined;

const fmt    = (n) => n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n) => n == null ? "—" : n.toFixed(1) + "%";
const fmtNum = (n) => n == null ? "—" : Math.round(n).toLocaleString("en-US");

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// ── Scoring ──────────────────────────────────────────────────────────────────
function calcScore(site) {
  const fr = FRANCHISES[site.franchise] || FRANCHISES["Pizza Hut"];
  let earned = 0, max = 0;

  const add = (pts, maxPts) => { earned += pts; max += maxPts; };

  if (isPresent(site.rentPsf)) {
    const r = parseFloat(site.rentPsf);
    add(r < 20 ? 12 : r < 30 ? 8 : r < 40 ? 4 : 0, 12);
  }
  if (isPresent(site.dailyTraffic)) {
    const t = parseFloat(site.dailyTraffic);
    add(t > 25000 ? 14 : t > 15000 ? 10 : t > 8000 ? 6 : 1, 14);
  }
  if (isPresent(site.pop3mi)) {
    const p = parseFloat(site.pop3mi);
    add(p > 80000 ? 12 : p > 40000 ? 8 : p > 20000 ? 5 : 1, 12);
  }
  if (isPresent(site.medianIncome)) {
    const m = parseFloat(site.medianIncome);
    add(m > 90000 ? 10 : m > 75000 ? 8 : m > 50000 ? 5 : 2, 10);
  }
  if (isPresent(site.competitors)) {
    const c = parseFloat(site.competitors);
    add(c <= 1 ? 10 : c <= 3 ? 7 : c <= 5 ? 3 : 0, 10);
  }
  if (isPresent(site.visibility)) {
    const v = site.visibility;
    add(v === "Excellent" ? 8 : v === "Good" ? 6 : v === "Average" ? 3 : 0, 8);
  }
  if (isPresent(site.parkingSpaces)) {
    const p = parseFloat(site.parkingSpaces);
    add(p > 30 ? 7 : p > 15 ? 5 : p >= 8 ? 3 : 1, 7);
  }
  if (isPresent(site.driveThru) && site.driveThru !== "") {
    add(site.driveThru === "Yes" ? 8 : 2, 8);
  }
  if (isPresent(site.sqft)) {
    const sf = parseFloat(site.sqft);
    const inRange = sf >= fr.sfMin && sf <= fr.sfMax;
    const near    = sf >= fr.sfMin * 0.8 && sf <= fr.sfMax * 1.2;
    add(inRange ? 6 : near ? 3 : 0, 6);
  }

  if (max === 0) return null;
  return Math.round((earned / max) * 100);
}

function scoreInfo(score) {
  if (score === null) return { color: "#94a3b8", label: "INSUFFICIENT DATA", badge: "INSUFFICIENT DATA", bg: "#f1f5f9", text: "#64748b" };
  if (score >= 75)   return { color: "#059669", label: "STRONG",   badge: "RECOMMENDED",     bg: "#ecfdf5", text: "#059669" };
  if (score >= 55)   return { color: "#d97706", label: "MODERATE", badge: "CONDITIONAL",     bg: "#fffbeb", text: "#d97706" };
  return               { color: "#dc2626", label: "WEAK",     badge: "NOT RECOMMENDED", bg: "#fef2f2", text: "#dc2626" };
}

// ── Financial Calcs ──────────────────────────────────────────────────────────
function calcFinancials(site) {
  const fr = FRANCHISES[site.franchise] || FRANCHISES["Pizza Hut"];
  const fin = {};

  const hasTraffic = isPresent(site.dailyTraffic);
  const hasSqft    = isPresent(site.sqft);
  const hasRentPsf = isPresent(site.rentPsf);

  // Revenue
  if (hasTraffic) {
    const captureRate = site.driveThru === "Yes" ? 0.012 : 0.008;
    fin.dailyCustomers = Math.round(parseFloat(site.dailyTraffic) * captureRate);
    fin.annualRevenue  = fin.dailyCustomers * fr.avgTicket * 360;
  }

  // Rent
  if (hasSqft && hasRentPsf) {
    fin.annualRent = parseFloat(site.sqft) * parseFloat(site.rentPsf);
  }

  // Expenses (each gated)
  const rev = fin.annualRevenue;
  fin.cogs      = rev != null ? rev * 0.30 : null;
  fin.labor     = rev != null ? rev * 0.28 : null;
  fin.royalties = rev != null ? rev * fr.royalty : null;
  fin.adFees    = rev != null ? rev * fr.adFee : null;
  fin.utilities = hasSqft ? parseFloat(site.sqft) * 8 : null;
  fin.insurance = 12000;
  fin.misc      = rev != null ? rev * 0.03 : null;

  // Total expenses
  if (rev != null) {
    const parts = [fin.cogs, fin.labor, fin.royalties, fin.adFees, fin.utilities, fin.insurance, fin.misc];
    fin.totalExpenses = parts.reduce((acc, x) => acc + (x ?? 0), 0);
    fin.noi = fin.annualRevenue - fin.totalExpenses;
  }

  // Investment
  fin.totalInvestment = fr.franchiseFee + fr.buildout + (fin.annualRent != null ? fin.annualRent * 0.25 : 0);

  // Derived
  if (fin.noi != null && fin.annualRevenue > 0) {
    fin.profitMargin = (fin.noi / fin.annualRevenue) * 100;
  }
  if (fin.noi != null && fin.noi > 0) {
    fin.paybackYears = fin.totalInvestment / fin.noi;
  }
  if (fin.annualRent != null && fin.annualRevenue != null && fin.annualRevenue > 0) {
    fin.rentToRevenue = (fin.annualRent / fin.annualRevenue) * 100;
  }

  return fin;
}

// ── Strengths & Risks ────────────────────────────────────────────────────────
function getStrengthsRisks(site, fin) {
  const strengths = [], risks = [];

  if (isPresent(site.dailyTraffic) && parseFloat(site.dailyTraffic) > 20000)    strengths.push("High daily traffic (>20,000 vehicles)");
  if (isPresent(site.pop3mi)        && parseFloat(site.pop3mi) > 60000)          strengths.push("Strong trade area population (>60k within 3mi)");
  if (isPresent(site.medianIncome)  && parseFloat(site.medianIncome) > 75000)    strengths.push("Above-average median household income");
  if (isPresent(site.competitors)   && parseFloat(site.competitors) <= 2)        strengths.push("Low competition (≤2 nearby competitors)");
  if (site.driveThru === "Yes")                                                   strengths.push("Drive-thru available — higher capture rate");
  if (site.visibility === "Excellent" || site.visibility === "Good")             strengths.push(`${site.visibility} site visibility`);
  if (fin.paybackYears != null && fin.paybackYears < 4)                          strengths.push(`Fast payback period (~${fin.paybackYears.toFixed(1)} yrs)`);

  if (isPresent(site.dailyTraffic) && parseFloat(site.dailyTraffic) < 10000)    risks.push("Low daily traffic (<10,000 vehicles)");
  if (isPresent(site.pop3mi)        && parseFloat(site.pop3mi) < 25000)          risks.push("Small trade area population (<25k within 3mi)");
  if (isPresent(site.competitors)   && parseFloat(site.competitors) > 4)         risks.push(`High competition (${site.competitors} nearby competitors)`);
  if (fin.rentToRevenue != null     && fin.rentToRevenue > 12)                   risks.push(`High rent-to-revenue ratio (${fmtPct(fin.rentToRevenue)})`);
  if (fin.profitMargin != null      && fin.profitMargin < 8)                     risks.push(`Low profit margin (${fmtPct(fin.profitMargin)})`);
  if (site.visibility === "Poor")                                                  risks.push("Poor site visibility");
  if (fin.paybackYears != null && fin.paybackYears > 7)                          risks.push(`Long payback period (~${fin.paybackYears.toFixed(1)} yrs)`);

  return { strengths, risks };
}

// ── Scoring Fields Counter ───────────────────────────────────────────────────
const SCORE_FIELDS = ["sqft","rentPsf","dailyTraffic","pop3mi","medianIncome","competitors","visibility","parkingSpaces","driveThru"];
function filledCount(site) {
  return SCORE_FIELDS.filter(f => isPresent(site[f]) && site[f] !== "").length;
}

// ── SVG Score Gauge ──────────────────────────────────────────────────────────
function ScoreGauge({ score }) {
  const info   = scoreInfo(score);
  const r      = 55;
  const circ   = 2 * Math.PI * r;
  const offset = score == null ? circ : circ - (score / 100) * circ;

  return (
    <div style={{ textAlign: "center", width: 130 }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        {score !== null && (
          <circle
            cx={65} cy={65} r={r}
            fill="none"
            stroke={info.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        )}
      </svg>
      <div style={{ marginTop: -108, marginBottom: 8 }}>
        {score !== null ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 800, color: info.color, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 10, color: info.color, fontWeight: 700, marginTop: 2 }}>{info.label}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", lineHeight: 1 }}>NO DATA</div>
            <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>Add fields</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── New Site Factory ─────────────────────────────────────────────────────────
function newSite() {
  return {
    id: genId(),
    name: "", franchise: "Pizza Hut", address: "", city: "", state: "", zip: "",
    sqft: "", lotSize: "", yearBuilt: "", zoning: "",
    rentPsf: "", dailyTraffic: "", pop3mi: "", medianIncome: "", competitors: "",
    visibility: "", parkingSpaces: "", driveThru: "", notes: "",
  };
}

// ── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  label:   { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" },
  input:   { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif", color: "#0f172a", outline: "none" },
  card:    { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  secHdr:  { fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#4f46e5", fontWeight: 700, marginBottom: 12, marginTop: 4 },
  grid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
};

// ── Field Component ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

// ── Site Form Card ───────────────────────────────────────────────────────────
function SiteCard({ site, idx, total, onChange, onRemove }) {
  const update = (k, v) => onChange(site.id, k, v);
  const inp  = (k, type = "text", placeholder = "") => (
    <input
      style={S.input} type={type} value={site[k]} placeholder={placeholder}
      onChange={e => update(k, e.target.value)}
    />
  );
  const sel = (k, opts) => (
    <select style={S.input} value={site[k]} onChange={e => update(k, e.target.value)}>
      <option value="">— Select —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const filled = filledCount(site);

  return (
    <div style={{ ...S.card, marginBottom: 16 }}>
      {/* Card Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#4f46e5", background: "#eef2ff", padding: "3px 10px", borderRadius: 4 }}>
          SITE {idx + 1}
        </span>
        <select
          style={{ ...S.input, width: "auto", minWidth: 160 }}
          value={site.franchise}
          onChange={e => update("franchise", e.target.value)}
        >
          {FRANCHISE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        {total > 1 && (
          <button
            onClick={() => onRemove(site.id)}
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Property Details */}
      <div style={S.secHdr}>Property Details</div>
      <div style={S.grid}>
        <Field label="Site Name">{inp("name", "text", "e.g. 123 Main St Location")}</Field>
        <Field label="Address">{inp("address", "text", "Street address")}</Field>
        <Field label="City">{inp("city")}</Field>
        <Field label="State">{inp("state", "text", "e.g. NY")}</Field>
        <Field label="ZIP">{inp("zip")}</Field>
        <Field label="Building SF">{inp("sqft", "number", "e.g. 2000")}</Field>
        <Field label="Lot Size (SF)">{inp("lotSize", "number", "e.g. 15000")}</Field>
        <Field label="Year Built">{inp("yearBuilt", "number", "e.g. 1998")}</Field>
        <Field label="Zoning">
          {sel("zoning", ["Commercial","Mixed-Use","Industrial","Special Use"])}
        </Field>
      </div>

      {/* Financial & Lease */}
      <div style={{ ...S.secHdr, marginTop: 18 }}>Financial & Lease</div>
      <div style={S.grid}>
        <Field label="Rent ($/SF/yr)">{inp("rentPsf", "number", "e.g. 24")}</Field>
      </div>

      {/* Trade Area & Demographics */}
      <div style={{ ...S.secHdr, marginTop: 18 }}>Trade Area & Demographics</div>
      <div style={S.grid}>
        <Field label="Daily Traffic Count">{inp("dailyTraffic", "number", "e.g. 18000")}</Field>
        <Field label="Population (3mi)">{inp("pop3mi", "number", "e.g. 55000")}</Field>
        <Field label="Median Household Income ($)">{inp("medianIncome", "number", "e.g. 68000")}</Field>
        <Field label="Nearby Competitors">{inp("competitors", "number", "e.g. 3")}</Field>
      </div>

      {/* Site Characteristics */}
      <div style={{ ...S.secHdr, marginTop: 18 }}>Site Characteristics</div>
      <div style={S.grid}>
        <Field label="Visibility">{sel("visibility", ["Excellent","Good","Average","Poor"])}</Field>
        <Field label="Parking Spaces">{inp("parkingSpaces", "number", "e.g. 25")}</Field>
        <Field label="Drive-Thru">{sel("driveThru", ["Yes","No"])}</Field>
      </div>

      {/* Notes */}
      <div style={{ ...S.secHdr, marginTop: 18 }}>Notes</div>
      <textarea
        style={{ ...S.input, minHeight: 70, resize: "vertical" }}
        value={site.notes}
        placeholder="Broker notes, observations, concerns..."
        onChange={e => update("notes", e.target.value)}
      />

      {/* Field counter */}
      <div style={{ textAlign: "right", marginTop: 10, fontSize: 12, color: "#64748b" }}>
        <span style={{ fontWeight: 600, color: filled >= 7 ? "#059669" : filled >= 4 ? "#d97706" : "#dc2626" }}>{filled}</span> of 9 scoring fields filled
      </div>
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#0f172a" }}>{value}</div>
    </div>
  );
}

// ── Expense Row ──────────────────────────────────────────────────────────────
function ExpRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 600, color: value === "—" ? "#cbd5e1" : "#0f172a" }}>{value}</span>
    </div>
  );
}

// ── Report Card for one site ─────────────────────────────────────────────────
function ReportCard({ site }) {
  const score = calcScore(site);
  const info  = scoreInfo(score);
  const fin   = calcFinancials(site);
  const fr    = FRANCHISES[site.franchise] || FRANCHISES["Pizza Hut"];
  const { strengths, risks } = getStrengthsRisks(site, fin);

  const noiBgColor = fin.noi == null ? undefined : fin.noi > 0 ? "#ecfdf5" : "#fef2f2";
  const noiColor   = fin.noi == null ? undefined : fin.noi > 0 ? "#059669" : "#dc2626";

  const marginColor = fin.profitMargin == null ? undefined : fin.profitMargin >= 12 ? "#059669" : fin.profitMargin >= 8 ? "#d97706" : "#dc2626";
  const paybackColor = fin.paybackYears == null ? undefined : fin.paybackYears < 4 ? "#059669" : fin.paybackYears < 7 ? "#d97706" : "#dc2626";
  const rtrColor   = fin.rentToRevenue == null ? undefined : fin.rentToRevenue <= 8 ? "#059669" : fin.rentToRevenue <= 12 ? "#d97706" : "#dc2626";

  const displayName = site.name || site.address || `Site`;

  return (
    <div style={{ ...S.card, marginBottom: 20 }}>
      {/* Site header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{displayName}</h3>
            <span style={{ background: info.bg, color: info.text, border: `1px solid ${info.color}22`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
              {info.badge}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
            {[site.address, site.city, site.state, site.zip].filter(Boolean).join(", ") || "No address entered"}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              site.franchise,
              isPresent(site.sqft) ? `${parseInt(site.sqft).toLocaleString()} SF` : null,
              isPresent(site.driveThru) && site.driveThru !== "" ? `Drive-Thru: ${site.driveThru}` : null,
            ].filter(Boolean).map(tag => (
              <span key={tag} style={{ background: "#eef2ff", color: "#4f46e5", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
        <ScoreGauge score={score} />
      </div>

      {/* Financial Projections */}
      <div style={S.secHdr}>Financial Projections</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, marginBottom: 18 }}>
        <MetricCard label="Est. Annual Revenue"  value={fmt(fin.annualRevenue)} />
        <MetricCard label="Annual Rent"          value={fmt(fin.annualRent)} />
        <MetricCard label="Net Operating Income" value={fmt(fin.noi)} color={noiColor} />
        <MetricCard label="Total Investment"     value={fmt(fin.totalInvestment)} />
        <MetricCard label="Profit Margin"        value={fmtPct(fin.profitMargin)} color={marginColor} />
        <MetricCard label="Payback Period"       value={fin.paybackYears != null ? `${fin.paybackYears.toFixed(1)} yrs` : "—"} color={paybackColor} />
        <MetricCard label="Rent-to-Revenue"      value={fmtPct(fin.rentToRevenue)} color={rtrColor} />
        <MetricCard label="Est. Daily Customers" value={fmtNum(fin.dailyCustomers)} />
      </div>

      {/* Expense Breakdown */}
      <div style={S.secHdr}>Expense Breakdown</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", marginBottom: 18 }}>
        <div>
          <ExpRow label="COGS (30%)"        value={fmt(fin.cogs)} />
          <ExpRow label="Labor (28%)"       value={fmt(fin.labor)} />
          <ExpRow label="Annual Rent"       value={fmt(fin.annualRent)} />
          <ExpRow label={`Royalties (${fmtPct(fr.royalty * 100)})`} value={fmt(fin.royalties)} />
        </div>
        <div>
          <ExpRow label={`Ad Fund (${fmtPct(fr.adFee * 100)})`} value={fmt(fin.adFees)} />
          <ExpRow label="Utilities ($8/SF)" value={fmt(fin.utilities)} />
          <ExpRow label="Insurance"         value={fmt(fin.insurance)} />
          <ExpRow label="Misc (3%)"         value={fmt(fin.misc)} />
        </div>
      </div>

      {/* Strengths & Risks */}
      <div style={S.secHdr}>Site Assessment</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Strengths</div>
          {strengths.length > 0 ? strengths.map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: "#065f46", marginBottom: 5 }}>✓ {s}</div>
          )) : (
            <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Add more data to identify strengths</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Risk Factors</div>
          {risks.length > 0 ? risks.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: "#991b1b", marginBottom: 5 }}>⚠ {r}</div>
          )) : (
            <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No major risks identified</div>
          )}
        </div>
      </div>

      {/* Broker Notes */}
      {isPresent(site.notes) && (
        <div style={{ background: "#f8fafc", borderLeft: "3px solid #4f46e5", borderRadius: "0 6px 6px 0", padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Broker Notes</div>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{site.notes}</div>
        </div>
      )}
    </div>
  );
}

// ── Comparison Table ─────────────────────────────────────────────────────────
function ComparisonTable({ sites }) {
  if (sites.length < 2) return null;

  const data = sites.map(s => {
    const score = calcScore(s);
    const fin   = calcFinancials(s);
    return { site: s, score, fin };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  // Find best value helper (for numeric rows, lower/higher depends on row)
  const bestIdx = (vals, higher = true) => {
    const valid = vals.map((v, i) => ({ v, i })).filter(x => x.v != null);
    if (valid.length < 2) return -1;
    return higher
      ? valid.reduce((best, x) => x.v > best.v ? x : best).i
      : valid.reduce((best, x) => x.v < best.v ? x : best).i;
  };

  const rows = [
    { label: "Site Score",      vals: data.map(d => d.score),              fmt: v => v != null ? `${v}/100` : "—", higher: true },
    { label: "Est. Revenue",    vals: data.map(d => d.fin.annualRevenue),  fmt: fmt,     higher: true  },
    { label: "NOI",             vals: data.map(d => d.fin.noi),            fmt: fmt,     higher: true  },
    { label: "Profit Margin",   vals: data.map(d => d.fin.profitMargin),   fmt: fmtPct,  higher: true  },
    { label: "Payback (yrs)",   vals: data.map(d => d.fin.paybackYears),   fmt: v => v != null ? v.toFixed(1) : "—", higher: false },
    { label: "Rent/SF/yr",      vals: data.map(d => isPresent(d.site.rentPsf) ? parseFloat(d.site.rentPsf) : null), fmt: v => v != null ? `$${v}` : "—", higher: false },
    { label: "Daily Traffic",   vals: data.map(d => isPresent(d.site.dailyTraffic) ? parseFloat(d.site.dailyTraffic) : null), fmt: fmtNum, higher: true },
    { label: "Competitors",     vals: data.map(d => isPresent(d.site.competitors) ? parseFloat(d.site.competitors) : null), fmt: fmtNum, higher: false },
  ];

  return (
    <div style={{ ...S.card, marginBottom: 20, overflowX: "auto" }}>
      <div style={S.secHdr}>Site Comparison</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 10px", color: "#94a3b8", fontWeight: 600, fontSize: 11, borderBottom: "2px solid #e2e8f0", minWidth: 120 }}>Metric</th>
            {data.map(d => (
              <th key={d.site.id} style={{ textAlign: "center", padding: "8px 10px", color: "#0f172a", fontWeight: 700, borderBottom: "2px solid #e2e8f0", minWidth: 130 }}>
                {d.site.name || d.site.address || `Site`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const bi = bestIdx(row.vals, row.higher);
            return (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={{ padding: "8px 10px", color: "#64748b", fontWeight: 500 }}>{row.label}</td>
                {row.vals.map((v, ci) => {
                  const isBest = ci === bi;
                  const display = row.fmt(v);
                  return (
                    <td key={ci} style={{ padding: "8px 10px", textAlign: "center", fontWeight: isBest ? 700 : 500, color: display === "—" ? "#cbd5e1" : isBest ? "#059669" : "#0f172a" }}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function SiteScorePro() {
  const [sites, setSites] = useState([newSite()]);
  const [view,  setView]  = useState("input"); // "input" | "report"
  const [mounted] = useState(true);

  const updateSite = useCallback((id, key, val) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s));
  }, []);

  const addSite = () => setSites(prev => [...prev, newSite()]);

  const removeSite = (id) => setSites(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);

  const canGenerate = sites.some(s => isPresent(s.name) || isPresent(s.address));

  const firstFr = FRANCHISES[sites[0]?.franchise] || FRANCHISES["Pizza Hut"];

  return (
    <>
      <FontLink />
      <div style={{ fontFamily: "DM Sans, sans-serif", background: "#f1f5f9", minHeight: "100vh", opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}>

        {/* ── Header ── */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "16px 0" }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>◎</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>
                  SiteScore <span style={{ color: "#4f46e5" }}>Pro</span>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Franchise Site Selection Report Generator for CRE Brokers</div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 8, padding: 4 }}>
              {[["input","Site Input"],["report","Report View"]].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "7px 18px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
                    background: view === v ? "#4f46e5" : "transparent",
                    color: view === v ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>

          {/* ═══════════════════════════════════ INPUT VIEW ═══════════════════════════════════ */}
          {view === "input" && (
            <div>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Site Entries</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                    Enter property and market data for each candidate location. Leave fields blank if unknown — they won't affect the score.
                  </p>
                </div>
                <button
                  onClick={addSite}
                  style={{ border: "2px solid #4f46e5", background: "#fff", color: "#4f46e5", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  + Add Site
                </button>
              </div>

              {/* Site cards */}
              {sites.map((s, i) => (
                <SiteCard key={s.id} site={s} idx={i} total={sites.length} onChange={updateSite} onRemove={removeSite} />
              ))}

              {/* Generate button */}
              <button
                disabled={!canGenerate}
                onClick={() => setView("report")}
                style={{
                  width: "100%", padding: "15px 0", border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: canGenerate ? "pointer" : "not-allowed",
                  background: canGenerate ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#e2e8f0",
                  color: canGenerate ? "#fff" : "#94a3b8",
                  fontFamily: "DM Sans, sans-serif",
                  transition: "opacity 0.2s",
                }}
              >
                Generate Site Selection Report →
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════ REPORT VIEW ══════════════════════════════════ */}
          {view === "report" && (
            <div>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Site Selection Report</h2>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{sites.length} site{sites.length > 1 ? "s" : ""} analyzed • {today}</div>
                </div>
                <button
                  onClick={() => setView("input")}
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
                >
                  ← Edit Sites
                </button>
              </div>

              {/* 1. Franchise Profile Card */}
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={S.secHdr}>Franchise Profile — {sites[0]?.franchise}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                  {[
                    ["Category",      firstFr.category],
                    ["Avg Ticket",    `$${firstFr.avgTicket.toFixed(2)}`],
                    ["Ideal SF",      `${firstFr.sfMin.toLocaleString()}–${firstFr.sfMax.toLocaleString()}`],
                    ["Royalty",       fmtPct(firstFr.royalty * 100)],
                    ["Ad Fee",        fmtPct(firstFr.adFee * 100)],
                    ["Franchise Fee", fmt(firstFr.franchiseFee)],
                    ["Buildout",      fmt(firstFr.buildout)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Comparison Table */}
              <ComparisonTable sites={sites} />

              {/* 3. Report Cards */}
              {sites.map(s => <ReportCard key={s.id} site={s} />)}

              {/* 4. Footer */}
              <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", padding: "16px 0 8px", borderTop: "1px solid #e2e8f0", marginTop: 8 }}>
                Generated by SiteScore Pro • For illustrative purposes — verify all data with actual market research
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
