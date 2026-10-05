import NearMissForm from "@/components/NearMissForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reporte de Seguridad — Near Misses | Isosafe Chile",
};

export default function NearMissPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <NearMissForm />
    </div>
  );
}
