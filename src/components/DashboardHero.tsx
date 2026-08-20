import Link from "next/link";

interface DashboardHeroProps {
  name: string;
  overallPct: number;
}

export default function DashboardHero({ name, overallPct }: DashboardHeroProps) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#8B0B21] to-[#C41230] text-white px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Left: text + actions */}
      <div className="flex-1 min-w-0">
        <p className="text-red-200 text-sm font-medium mb-1">
          {greeting}, {name}
        </p>
        <h2 className="text-2xl font-bold leading-tight">
          Sistema de Gestión
          <br />
          <span className="text-red-200">Purasafe</span>
        </h2>
        <p className="text-red-200 text-sm mt-2 max-w-sm">
          Cumplimiento legal · Documentación · Permisos de trabajo · Formación continua.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/requisitos"
            className="inline-flex items-center gap-1.5 bg-white text-[#C41230] font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            Ver requisitos
          </Link>
          <Link
            href="/sig"
            className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
          >
            Manual del SIG
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 text-white font-medium text-sm px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
          >
            ✦ Consulta IA
          </Link>
        </div>
      </div>

      {/* Right: compliance ring */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <ComplianceRing pct={overallPct} />
        <p className="text-red-200 text-xs text-center">Cumplimiento global</p>
      </div>
    </div>
  );
}

function ComplianceRing({ pct }: { pct: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{pct}%</span>
      </div>
    </div>
  );
}
