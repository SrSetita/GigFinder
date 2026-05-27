# GigFinder UI Enhancement — Glow, Gradient & Color — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir fuchsia como segundo acento, gradient-text en headlines, orbes animados en el hero, hover-glow en cards y botones — look Raycast-inspired medio para GigFinder. También corregir el bug de perfil 404.

**Architecture:** Cambios CSS-first en `globals.css` (tokens + clases utilitarias), luego aplicar en páginas con cambios mínimos de JSX. El bug de perfil se investiga en el primer task. Sin nuevas dependencias.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, CSS custom properties, `@keyframes` CSS puro.

**Spec:** `docs/superpowers/specs/2026-05-27-ui-enhancement-glow-gradient.md`

---

## File Map

| Archivo | Acción |
|---|---|
| `frontend/src/app/globals.css` | Añadir tokens, `.gradient-text`, `.orb`/`.orb-a`/`.orb-b`, keyframes, actualizar `.btn-primary`, `.hover-lift`, `.genre-pill` |
| `frontend/src/app/page.tsx` | Añadir orbes al hero, cambiar spans de texto a `.gradient-text` |
| `frontend/src/components/layout/Navbar.tsx` | `.gradient-text` en "Finder" |
| `frontend/src/app/profiles/[id]/page.tsx` | Bug fix 404 + fix `profile.role` + gradient en banner vacío + gradient-text en nombre |
| `frontend/src/app/bands/[id]/page.tsx` | gradient-text en nombre de banda |
| `frontend/src/app/dashboard/page.tsx` | gradient-text en heading |
| `frontend/src/app/search/page.tsx` | gradient-text en tipo de resultado activo |

---

## Task 1: Bug fix — profile page 404

**Files:**
- Modify: `frontend/src/app/profiles/[id]/page.tsx`

El usuario autenticado navega a `/profiles/[id]` y ve "Perfil no encontrado". Causa probable: `user.profile.id` en localStorage apunta a un perfil que ya no existe en la DB (sesión antigua, DB reseteada). Fix: si es el propio perfil del usuario y la API devuelve 404, redirigir a `/settings/profile` en lugar de mostrar el error genérico.

Bug secundario: `profile.role` en la línea de ROLE_LABELS usa el campo `role` del objeto Profile, pero `role` está en `profile.user.role`, no en el Profile directamente. El campo devuelto por la API es `profile.user?.role`.

- [ ] **Step 1: Leer el bloque de error y el uso de `role` en el archivo**

```bash
grep -n "profile.role\|profile\.role\|ROLE_LABELS\|not found\|no encontrado\|isOwnProfile\|useEffect" frontend/src/app/profiles/\[id\]/page.tsx | head -30
```

- [ ] **Step 2: Corregir el bloque "perfil no encontrado" para propio perfil**

Localizar el bloque `if (!profile)` (línea ~191) y reemplazarlo:

```tsx
  if (!profile) {
    // Si es el propio perfil del usuario y no se encuentra, puede ser sesión obsoleta
    const isOwnStale = !authLoading && user?.profile?.id === id
    if (isOwnStale) {
      router.replace('/settings/profile')
      return null
    }
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-[var(--text-muted)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-[var(--text-muted)]">Este perfil no existe o ha sido eliminado.</p>
      </div>
    )
  }
```

- [ ] **Step 3: Corregir `profile.role` → `profile.user?.role`**

Buscar en el archivo:
```bash
grep -n "profile\.role\b" frontend/src/app/profiles/\[id\]/page.tsx
```

Hay una línea que usa `ROLE_LABELS[profile.role]` — el objeto Profile de la API no tiene campo `role` directamente; el rol está en `profile.user?.role`. La variable `role` ya se define correctamente en línea ~204 como:
```tsx
const role = profile.user?.role
```

Verificar que ROLE_LABELS se usa con `role` (la variable), NO con `profile.role` directamente. Si hay `ROLE_LABELS[profile.role]`, reemplazar por `ROLE_LABELS[role ?? '']`.

```bash
# Localizar la línea exacta
grep -n "ROLE_LABELS\[profile" frontend/src/app/profiles/\[id\]/page.tsx
```

Reemplazar `ROLE_LABELS[profile.role]` por `ROLE_LABELS[role ?? '']` en esa línea.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/profiles/\[id\]/page.tsx
git commit -m "fix: profile 404 redirect for own stale session, fix profile.role lookup"
```

---

## Task 2: globals.css — nuevos tokens, clases, animaciones

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Añadir tokens de segundo acento y glows al bloque `:root`**

En `globals.css`, dentro del bloque `:root` existente (después de `--accent-subtle-hover`), añadir:

```css
  /* Segunda tonalidad — fuchsia */
  --accent-2: #e879f9;
  --accent-2-hover: #f0abfc;
  --accent-2-subtle: rgba(232, 121, 249, 0.08);

  /* Gradiente de marca */
  --gradient-brand: linear-gradient(135deg, #7c3aed 0%, #e879f9 100%);

  /* Glows */
  --glow-sm: 0 0 20px rgba(124, 58, 237, 0.25);
  --glow-md: 0 0 40px rgba(124, 58, 237, 0.35), 0 0 60px rgba(232, 121, 249, 0.15);
```

- [ ] **Step 2: Actualizar `.btn-primary` — gradiente de fondo + glow en hover**

Reemplazar el bloque `.btn-primary` completo (incluyendo su `@media hover` y `:active`):

```css
/* ─── Botón primario ─── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-brand);
  color: #fff;
  font-weight: 600;
  border-radius: 10px;
  transition: box-shadow 200ms var(--ease-ui), transform 120ms var(--ease-ui);
}
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover {
    box-shadow: var(--glow-sm);
  }
}
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.btn-primary:active {
  transform: scale(0.97);
}
```

- [ ] **Step 3: Actualizar `.hover-lift:hover` — añadir glow y cambiar border-color**

Reemplazar el bloque `@media (hover: hover) and (pointer: fine) { .hover-lift:hover { ... } }` existente:

```css
/* ─── Hover gates: solo en dispositivos con hover real ─── */
@media (hover: hover) and (pointer: fine) {
  .hover-lift:hover {
    border-color: rgba(124, 58, 237, 0.5) !important;
    box-shadow: var(--glow-sm);
    background: var(--surface-raised) !important;
  }
}
```

- [ ] **Step 4: Actualizar `.genre-pill:hover` — glow fuchsia**

Reemplazar el bloque `@media (hover: hover) and (pointer: fine) { .genre-pill:hover { ... } }` existente:

```css
@media (hover: hover) and (pointer: fine) {
  .genre-pill:hover {
    border-color: var(--accent-2);
    color: var(--text-primary);
    background: var(--accent-2-subtle);
    box-shadow: 0 0 12px rgba(232, 121, 249, 0.2);
  }
}
```

- [ ] **Step 5: Añadir clase `.gradient-text` y clases de orbes**

Al final del archivo, añadir:

```css
/* ─── Gradient text — uso: <span className="gradient-text">texto</span> ─── */
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ─── Orbes de fondo animados (hero) ─── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  will-change: transform;
  z-index: 0;
}
.orb-a {
  width: 600px;
  height: 600px;
  background: rgba(124, 58, 237, 0.18);
  top: -200px;
  left: -100px;
  animation: orb-drift-a 12s ease-in-out infinite;
}
.orb-b {
  width: 500px;
  height: 500px;
  background: rgba(232, 121, 249, 0.14);
  bottom: -150px;
  right: -100px;
  animation: orb-drift-b 14s ease-in-out infinite;
}

@keyframes orb-drift-a {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(40px, -30px); }
}
@keyframes orb-drift-b {
  0%, 100% { transform: translate(0, 0); }
  50%       { transform: translate(-30px, 20px); }
}

@media (prefers-reduced-motion: reduce) {
  .orb { animation: none; }
}
```

- [ ] **Step 6: Verificar que el servidor de dev compila**

```bash
# En frontend/
npm run dev
```

Esperado: compila sin errores. Abrir `http://localhost:3000` — el botón "Empieza gratis" debe verse con gradiente morado→fuchsia.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "style: add fuchsia accent, gradient-text, orb animations, glow tokens"
```

---

## Task 3: Home page — orbes y gradient-text

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Añadir orbes al DotGrid hero**

Localizar el bloque del hero en `frontend/src/app/page.tsx`:

```tsx
<DotGrid className="flex flex-col items-center justify-center px-6 py-32 text-center min-h-[86vh] relative">
  <div className="relative z-10 flex flex-col items-center max-w-[1120px] mx-auto w-full">
```

Añadir los dos divs de orbes como primeros children de `<DotGrid>`, ANTES del div `z-10`:

```tsx
<DotGrid className="flex flex-col items-center justify-center px-6 py-32 text-center min-h-[86vh] relative overflow-hidden">
  <div className="orb orb-a" aria-hidden="true" />
  <div className="orb orb-b" aria-hidden="true" />
  <div className="relative z-10 flex flex-col items-center max-w-[1120px] mx-auto w-full">
```

Nota: añadir `overflow-hidden` a DotGrid para que los orbes no sobresalgan.

- [ ] **Step 2: Cambiar "Llena tu sala." a gradient-text**

Localizar:
```tsx
<span className="text-[var(--accent)]">Llena tu sala.</span>
```

Reemplazar por:
```tsx
<span className="gradient-text">Llena tu sala.</span>
```

- [ ] **Step 3: Añadir gradient-text en "¿Cómo funciona?"**

Localizar:
```tsx
<h2 className="text-display mb-3">¿Cómo funciona?</h2>
```

Reemplazar por:
```tsx
<h2 className="text-display mb-3">¿Cómo <span className="gradient-text">funciona</span>?</h2>
```

- [ ] **Step 4: Añadir gradient-text en "Todos los géneros"**

Localizar:
```tsx
<h2 className="text-display mb-10 text-center">Todos los géneros</h2>
```

Reemplazar por:
```tsx
<h2 className="text-display mb-10 text-center">Todos los <span className="gradient-text">géneros</span></h2>
```

- [ ] **Step 5: Verificar en browser**

- Desktop: orbes visibles como luces de fondo difusas detrás del hero.
- "Llena tu sala." con gradiente morado→fuchsia visible.
- Los orbes no tapan el texto (z-10 correcto).
- Mobile 375px: orbes visibles pero no causan scroll horizontal (overflow-hidden).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "style: home — orb background, gradient-text on hero and section headings"
```

---

## Task 4: Navbar — gradient-text en logo

**Files:**
- Modify: `frontend/src/components/layout/Navbar.tsx`

- [ ] **Step 1: Localizar el logo en Navbar**

```bash
grep -n "GigFinder\|Finder\|gradient\|accent" frontend/src/components/layout/Navbar.tsx | head -10
```

Esperado: encontrar el span con `text-[var(--accent)]` alrededor de "Finder".

- [ ] **Step 2: Reemplazar color accent por gradient-text**

Localizar:
```tsx
<span className="text-[15px] font-black tracking-tight">
  Gig<span className="text-[var(--accent)]">Finder</span>
</span>
```

Reemplazar por:
```tsx
<span className="text-[15px] font-black tracking-tight">
  Gig<span className="gradient-text">Finder</span>
</span>
```

- [ ] **Step 3: Verificar en browser**

Logo "GigFinder": "Finder" con gradiente morado→fuchsia. Verificar en desktop y mobile.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Navbar.tsx
git commit -m "style: Navbar — gradient-text on logo Finder"
```

---

## Task 5: Páginas internas — gradient-text y gradient banner

**Files:**
- Modify: `frontend/src/app/profiles/[id]/page.tsx`
- Modify: `frontend/src/app/bands/[id]/page.tsx`
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/search/page.tsx`

### profiles/[id]/page.tsx

- [ ] **Step 1: Gradient en nombre de perfil**

Localizar:
```tsx
<h1 className="text-[1.5rem] font-bold">{profile.displayName}</h1>
```

Reemplazar por:
```tsx
<h1 className="text-[1.5rem] font-bold">
  <span className="gradient-text">{profile.displayName}</span>
</h1>
```

- [ ] **Step 2: Gradient en banner vacío**

Localizar el div del banner vacío (dentro del header, cuando no hay `profile.bannerUrl`):
```tsx
: <div className="w-full h-full bg-[var(--surface-raised)]" />
```

Reemplazar por:
```tsx
: <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(232,121,249,0.1) 100%)' }} />
```

### bands/[id]/page.tsx

- [ ] **Step 3: Gradient en nombre de banda**

Localizar:
```tsx
<h1 className="text-[1.5rem] font-bold mb-1">{band.name}</h1>
```

Reemplazar por:
```tsx
<h1 className="text-[1.5rem] font-bold mb-1">
  <span className="gradient-text">{band.name}</span>
</h1>
```

### dashboard/page.tsx

- [ ] **Step 4: Gradient en heading del dashboard**

Localizar en `frontend/src/app/dashboard/page.tsx` línea ~79:
```tsx
<h1 className="text-2xl font-bold">Mis bandas</h1>
```

Reemplazar por:
```tsx
<h1 className="text-2xl font-bold">Mis <span className="gradient-text">bandas</span></h1>
```

### search/page.tsx

- [ ] **Step 5: Gradient en tipo de resultado activo**

Localizar:
```tsx
<h1 className="text-xl font-bold">
  {activeType ? TYPE_LABELS[activeType] : 'Todos'}
```

Reemplazar por:
```tsx
<h1 className="text-xl font-bold">
  {activeType
    ? <span className="gradient-text">{TYPE_LABELS[activeType]}</span>
    : 'Todos'}
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Esperado: sin errores.

- [ ] **Step 7: Verificar en browser**

- `/profiles/[id]`: nombre con gradiente, banner vacío con gradiente sutil.
- `/bands/[id]`: nombre con gradiente.
- `/dashboard`: heading con gradiente.
- `/search?type=venue`: "Salas" con gradiente.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/profiles/\[id\]/page.tsx frontend/src/app/bands/\[id\]/page.tsx frontend/src/app/dashboard/page.tsx frontend/src/app/search/page.tsx
git commit -m "style: internal pages — gradient-text on names and headings, gradient banner"
```

---

## Criterios de aceptación finales

- [ ] Bug perfil: usuario propio con sesión obsoleta redirige a /settings/profile
- [ ] `profile.role` → `ROLE_LABELS[role ?? '']` en profile page
- [ ] Orbes visibles en hero, no bloquean texto, no causan scroll horizontal
- [ ] "Llena tu sala." con gradiente morado→fuchsia
- [ ] Botón primario: gradiente de fondo + glow en hover desktop
- [ ] Cards: box-shadow glow al hover en desktop
- [ ] Genre pills: glow fuchsia al hover
- [ ] Logo "GigFinder": "Finder" con gradient-text
- [ ] Nombre de perfil, banda, tipo de búsqueda: gradient-text
- [ ] Banner vacío en perfiles: gradiente sutil de fondo
- [ ] `prefers-reduced-motion`: orbes estáticos
- [ ] Mobile: hover-glow no aparece en touch
- [ ] TypeScript sin errores
