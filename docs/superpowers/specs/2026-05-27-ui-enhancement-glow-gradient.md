# GigFinder UI Enhancement — Glow, Gradient & Color

## Goal

Añadir brillo, animaciones y color al diseño Raycast-dark existente. Segunda tonalidad fuchsia (`#e879f9`) junto al morado existente. Nivel B: gradiente en headlines, orbes animados en hero, hover-glow en cards y botones, gradient-text en páginas internas.

## Architecture

Todos los cambios son CSS-first: nuevos tokens en `globals.css`, clases utilitarias nuevas (`.gradient-text`, `.orb`), sin nuevas dependencias JS. Las páginas consumen las clases nuevas con cambios mínimos de JSX. El bug de perfil se investiga y corrige antes del trabajo visual.

## Tech Stack

Next.js 16 App Router, Tailwind CSS v4, CSS custom properties, `@keyframes` CSS puro.

---

## Design Tokens (globals.css)

```css
/* Segunda tonalidad */
--accent-2: #e879f9;
--accent-2-hover: #f0abfc;
--accent-2-subtle: rgba(232, 121, 249, 0.08);

/* Gradiente de marca */
--gradient-brand: linear-gradient(135deg, #7c3aed 0%, #e879f9 100%);

/* Glows */
--glow-sm: 0 0 20px rgba(124, 58, 237, 0.25);
--glow-md: 0 0 40px rgba(124, 58, 237, 0.35), 0 0 60px rgba(232, 121, 249, 0.15);
```

## Clases utilitarias nuevas (globals.css)

### .gradient-text

```css
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Uso: wrappear la palabra/frase clave de un `<h1>` o `<h2>` en `<span className="gradient-text">`.

### .orb (hero background blobs)

```css
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  will-change: transform;
}
.orb-a {
  width: 600px; height: 600px;
  background: rgba(124, 58, 237, 0.18);
  top: -200px; left: -100px;
  animation: orb-drift-a 12s ease-in-out infinite;
}
.orb-b {
  width: 500px; height: 500px;
  background: rgba(232, 121, 249, 0.14);
  bottom: -150px; right: -100px;
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

### .btn-primary — gradiente + glow

```css
.btn-primary {
  background: var(--gradient-brand);
  /* eliminar background: var(--accent) anterior */
  transition: box-shadow 200ms var(--ease-ui), transform 120ms var(--ease-ui);
}
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover {
    box-shadow: var(--glow-sm);
    /* eliminar background: var(--accent-hover) anterior */
  }
}
```

### .hover-lift — glow en cards

```css
@media (hover: hover) and (pointer: fine) {
  .hover-lift:hover {
    border-color: rgba(124, 58, 237, 0.5) !important;
    box-shadow: var(--glow-sm);
    background: var(--surface-raised) !important;
  }
}
```

### .genre-pill:hover — glow fuchsia sutil

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

---

## Páginas

### page.tsx (home)

**Hero:**
- Añadir 2 divs `.orb orb-a` y `.orb orb-b` dentro de `<DotGrid>` como primeros children (antes del `z-10` div)
- `<DotGrid>` ya tiene `position: relative` (necesario para orbes absolutos)
- Cambiar `<span className="text-[var(--accent)]">Llena tu sala.</span>` → `<span className="gradient-text">Llena tu sala.</span>`

**Sección "¿Cómo funciona?":**
- Cambiar heading: `<h2 className="text-display mb-3">¿Cómo <span className="gradient-text">funciona</span>?</h2>`

**Sección "Todos los géneros":**
- Cambiar heading: `<h2 className="text-display mb-10 text-center">Todos los <span className="gradient-text">géneros</span></h2>`

### Navbar.tsx

```tsx
// Cambiar:
<span className="text-[15px] font-black tracking-tight">
  Gig<span className="text-[var(--accent)]">Finder</span>
</span>
// Por:
<span className="text-[15px] font-black tracking-tight">
  Gig<span className="gradient-text">Finder</span>
</span>
```

### profiles/[id]/page.tsx

**Bug fix (Task 1):**
- Investigar por qué `/profiles/[id]` devuelve "no encontrado" para el usuario autenticado
- Verificar que `user.profile?.id` en Navbar/BottomNav sea el ID correcto del perfil
- Verificar que la API `/api/profiles/:id` acepte el mismo ID que se envía en la URL
- Fix el campo incorrecto si hay discrepancia

**Visual:**
- Banner vacío: reemplazar `bg-[var(--surface-raised)]` por gradiente: `background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(232,121,249,0.1) 100%)`
- Nombre de perfil: `<h1 className="text-[1.5rem] font-bold"><span className="gradient-text">{profile.displayName}</span></h1>`
- Avatar placeholder: fondo con `background: var(--gradient-brand)` en lugar de `--accent` sólido donde corresponda

### bands/[id]/page.tsx

- Nombre de banda: `<h1 className="text-[1.5rem] font-bold mb-1"><span className="gradient-text">{band.name}</span></h1>`

### dashboard/page.tsx

- Heading principal (Mis bandas / título de página): envolver texto clave en `<span className="gradient-text">`

### search/page.tsx

- Heading de resultados activos: `{activeType ? <span className="gradient-text">{TYPE_LABELS[activeType]}</span> : 'Todos'}`

---

## Criterios de aceptación

- [ ] Hero: orbes visibles pero sutiles, no distraen el texto
- [ ] "Llena tu sala." con gradiente morado→fuchsia
- [ ] Logo "GigFinder": "Finder" con gradient-text
- [ ] Botón primario: gradiente de fondo, glow en hover desktop
- [ ] Cards: box-shadow glow al hover en desktop
- [ ] Genre pills: glow fuchsia al hover
- [ ] Banner vacío en perfiles: gradiente de fondo en lugar de gris
- [ ] Nombre de perfil, banda, resultados: gradient-text en elemento clave
- [ ] `prefers-reduced-motion`: orbes estáticos, transiciones respetan 300ms
- [ ] Mobile: hover-glow no aparece en touch (gate @media hover)
- [ ] Bug perfil: `/profiles/[id]` carga correctamente para usuario autenticado
- [ ] Sin nuevas dependencias JS
- [ ] TypeScript sin errores

## File Map

| Archivo | Acción |
|---|---|
| `frontend/src/app/globals.css` | Tokens nuevos, .gradient-text, .orb/.orb-a/.orb-b, keyframes, actualizar .btn-primary/.hover-lift/.genre-pill |
| `frontend/src/app/page.tsx` | Orbes en DotGrid, gradient-text en headline + headings |
| `frontend/src/components/layout/Navbar.tsx` | gradient-text en "Finder" |
| `frontend/src/app/profiles/[id]/page.tsx` | Bug fix + gradient banner + gradient-text nombre |
| `frontend/src/app/bands/[id]/page.tsx` | gradient-text nombre banda |
| `frontend/src/app/dashboard/page.tsx` | gradient-text heading |
| `frontend/src/app/search/page.tsx` | gradient-text resultado activo |
