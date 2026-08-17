# Puratoslegal

Plataforma de cumplimiento legal: vincula requisitos legales con su evidencia
documental (SharePoint), permisos a evidenciar, y muestra un dashboard de
estado de cumplimiento con planes de acción para brechas. Pensada para
facilitar auditorías externas sin fricción humana.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS

## Desarrollo

```bash
npm install
npm run dev
```

## Gestor documental (`/documentos`)

Módulo básico para subir y descargar los procedimientos, matrices y
registros del SGI, clasificados por punto normativo (4.1, 4.2, ... según
ISO 14001 / 45001). El archivo se sube directo desde el navegador al bucket
de Supabase Storage; la app solo guarda el nombre, punto normativo y el
link en su base de datos (Postgres, vía Prisma).

### Variables de entorno necesarias

Agrega estas dos, además de las que ya existían (`DATABASE_URL`,
`AUTH_SECRET`, etc.):

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Son públicas por diseño (se usan en el navegador), así que no hace falta
tratarlas como secreto — igual, van solo en `.env.local` / variables de
entorno de Vercel, nunca hardcodeadas en el código.

### Configuración única en Supabase (una sola vez)

1. **Storage > New bucket** → nombre `documentos`, marcar **Public bucket**.
2. **SQL Editor** → pegar y ejecutar:

   ```sql
   create policy "documentos_insert" on storage.objects
     for insert to anon
     with check (bucket_id = 'documentos');

   create policy "documentos_select" on storage.objects
     for select to anon
     using (bucket_id = 'documentos');

   create policy "documentos_delete" on storage.objects
     for delete to anon
     using (bucket_id = 'documentos');
   ```

La tabla `Documento` en Postgres se crea sola: el `npm run build` ya
corre `prisma migrate deploy` en cada despliegue.
