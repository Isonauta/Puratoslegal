"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "@/components/pts/ui/Button";

interface SignaturePadProps {
  label?: string;
  onSave: (dataUrl: string) => void;
  initialValue?: string | null;
}

export default function SignaturePad({ label, onSave, initialValue }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [saved, setSaved] = useState<string | null>(initialValue ?? null);

  function handleClear() {
    sigRef.current?.clear();
    setSaved(null);
  }

  function handleSave() {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    let dataUrl: string;
    try {
      dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    } catch {
      dataUrl = sigRef.current.getCanvas().toDataURL("image/png");
    }
    setSaved(dataUrl);
    onSave(dataUrl);
  }

  if (saved) {
    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={saved}
          alt="Firma"
          className="border border-gray-300 rounded-lg bg-white w-full max-w-xs h-32 object-contain"
        />
        <Button type="button" variant="secondary" onClick={handleClear}>
          Volver a firmar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="border border-gray-300 rounded-lg bg-white touch-none">
        <SignatureCanvas
          ref={sigRef}
          penColor="#0f172a"
          clearOnResize={false}
          canvasProps={{ className: "w-full h-40" }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={handleClear}>
          Limpiar
        </Button>
        <Button type="button" variant="primary" onClick={handleSave}>
          Guardar firma
        </Button>
      </div>
    </div>
  );
}
