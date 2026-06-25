"use client";

import { useState } from "react";

export default function ImportPage() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("Importando...");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "x-import-secret": secret },
      body: form,
    });
    const data = await res.json();
    setStatus(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ padding: 32, maxWidth: 480, fontFamily: "monospace" }}>
      <h1>Import inicial de datos</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Secret
          <input value={secret} onChange={(e) => setSecret(e.target.value)} style={{ display: "block", width: "100%", marginBottom: 12 }} />
        </label>
        <label>
          Matriz Legal (.xlsx)
          <input type="file" name="matriz" required style={{ display: "block", marginBottom: 12 }} />
        </label>
        <label>
          Evidencias Generables (.xlsx)
          <input type="file" name="evidencias" required style={{ display: "block", marginBottom: 12 }} />
        </label>
        <label>
          Permisos y Autorizaciones (.xlsx)
          <input type="file" name="permisos" required style={{ display: "block", marginBottom: 12 }} />
        </label>
        <button type="submit">Importar</button>
      </form>
      <pre>{status}</pre>
    </main>
  );
}
