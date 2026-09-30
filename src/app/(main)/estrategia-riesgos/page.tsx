import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ContextoClient from "./ContextoClient";

export const dynamic = "force-dynamic";

export default async function EstrategiaRiesgosPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const [rawRiesgos, rawPestel, rawFoda, partesInteresadas, contextoConfig, rawClimatica] = await Promise.all([
    prisma.riesgoOportunidad.findMany({
      include: { origenFoda: true },
      orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
    }),
    prisma.pestelFactor.findMany({ orderBy: [{ categoria: "asc" }, { createdAt: "desc" }] }),
    prisma.fodaItem.findMany({
      include: { origenPestel: true },
      orderBy: [{ cuestion: "asc" }, { createdAt: "desc" }],
    }),
    prisma.parteInteresada.findMany({ orderBy: [{ createdAt: "asc" }] }),
    prisma.siteConfig.findMany({ where: { key: { startsWith: "contexto." } } }),
    prisma.determinacionClimatica.findMany({ orderBy: [{ fecha: "desc" }] }),
  ]);

  // Valores por defecto tomados del alcance real del SIG (SIG-R-100) —
  // el admin puede editarlos en la pestaña Contexto antes de generar el PESTEL.
  const contextoMap = Object.fromEntries(contextoConfig.map((c) => [c.key.replace("contexto.", ""), c.value]));
  const contexto = {
    rubro: contextoMap.rubro ?? "Elaboración de materias primas para panadería, pastelería, chocolatería y planta de cremas UHT, desde la recepción de materias primas hasta el almacenamiento de producto terminado.",
    ubicaciones: contextoMap.ubicaciones ?? "Av. Aeropuerto 9790, Cerrillos, Región Metropolitana (comuna colindante con Lo Espejo).",
    tipoClientes: contextoMap.tipoClientes ?? "Clientes corporativos B2B (panadería, pastelería, chocolatería) nacionales e internacionales, incluyendo cadenas de retail.",
    mercado: contextoMap.mercado ?? "Industria alimentaria — ingredientes y materias primas para panadería, pastelería y chocolatería. Filial de Puratos Group (multinacional belga).",
    adicional: contextoMap.adicional ?? "",
  };

  const riesgos = rawRiesgos.map((r) => ({
    ...r,
    fechaRevision: r.fechaRevision?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    origenFoda: r.origenFoda ? { ...r.origenFoda, createdAt: r.origenFoda.createdAt.toISOString(), updatedAt: r.origenFoda.updatedAt.toISOString() } : null,
  }));

  const pestel = rawPestel.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const foda = rawFoda.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    origenPestel: f.origenPestel ? { ...f.origenPestel, createdAt: f.origenPestel.createdAt.toISOString(), updatedAt: f.origenPestel.updatedAt.toISOString() } : null,
  }));

  const climatica = rawClimatica.map((d) => ({
    ...d,
    fecha: d.fecha.toISOString(),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <ContextoClient
      riesgos={riesgos}
      pestel={pestel}
      foda={foda}
      partesInteresadas={partesInteresadas}
      contexto={contexto}
      climatica={climatica}
      isAdmin={isAdmin}
    />
  );
}
