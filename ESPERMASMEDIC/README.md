# Espermas Medic Academy

Plataforma web de bancos de preguntas de medicina: cursos, práctica con explicaciones, simulacros cronometrados, progreso del estudiante y panel de administración.

**Tecnologías:** React + TypeScript + Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage) y Cloudflare Pages. Todo con planes gratuitos.

---

## 1. Probar en tu computadora

```bash
npm install
cp .env.example .env.local     # y completa los dos valores (paso 3)
npm run dev                    # http://localhost:5173
```

## 2. Subir a GitHub

La carpeta del proyecto (con `package.json`, `index.html` y `src/` juntos) debe quedar **en la raíz** del repositorio.

```bash
git init
git add .
git commit -m "Espermas Medic Academy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

`.gitignore` ya excluye `node_modules`, `dist` y tus archivos `.env`. **Nunca subas `.env.local`.**

## 3. Configurar Supabase

1. Crea una cuenta en https://supabase.com y pulsa **New project**. Guarda la contraseña de la base de datos.
2. **SQL Editor > New query**: pega todo `supabase/setup.sql` y pulsa **Run** (una sola vez). Crea tablas, seguridad (RLS), cursos de ejemplo y 6 preguntas de ejemplo.
3. **Project Settings > API**: copia la **Project URL** y la clave **anon public**. No uses la `service_role`.
4. Pégalas en `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon
   ```
5. **Authentication > URL Configuration**: cuando tengas tu dirección de Cloudflare, pon en *Site URL* `https://TU-PROYECTO.pages.dev` y añade esa misma dirección y `http://localhost:5173` en *Redirect URLs* (necesario para recuperar contraseñas).
6. Opcional para pruebas: **Authentication > Providers > Email > Confirm email** en desactivado.

### Hacerte administrador
Regístrate en la página y luego ejecuta en el SQL Editor:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'TU_CORREO');
```
Cierra sesión y vuelve a entrar: aparecerá **Administración** en el menú. Los estudiantes no pueden cambiar su rol ni modificar preguntas (lo impide la base de datos, no solo la interfaz).

## 4. Desplegar en Cloudflare Pages

1. https://dash.cloudflare.com > **Workers & Pages > Create > Pages > Connect to Git** y elige tu repositorio.
2. Configuración de compilación:
   - **Framework preset:** Vite (o ninguno)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** vacío (si el proyecto está en la raíz del repo)
3. **Environment variables** (en Production y Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Save and Deploy**. Cada `git push` vuelve a desplegar.
5. Copia la URL final (`*.pages.dev`) y colócala en Supabase (paso 3.5).

> Las variables `VITE_*` se incorporan al compilar. Si las cambias, vuelve a desplegar.

## 5. Cargar preguntas

- **Una por una:** Administración > Preguntas > Nueva pregunta.
- **En masa:** Administración > Importar. Descarga la plantilla CSV, complétala (o usa Excel `.xlsx`) y súbela. Columnas:
  `curso, unidad, tema, enunciado, a, b, c, d, e, correcta, explicacion, exp_a … exp_e, dificultad`
  El curso debe existir (se puede crear en *Cursos y temas*); unidades y temas nuevos se crean solos.
- Las 6 preguntas de ejemplo se pueden eliminar desde el mismo panel.

## 6. Sonido de acierto
Al acertar suena `public/sounds/killpop.mp3` junto con una breve animación. Para cambiarlo, reemplaza ese archivo.

## Estructura
```
src/components   piezas de interfaz        src/pages     pantallas (inicio, curso, simulacros, progreso, admin)
src/lib          Supabase y hooks          src/data      iconos y datos base de cursos
supabase/setup.sql   base de datos y seguridad      scripts/check-structure.mjs   verifica la estructura antes de compilar
```
