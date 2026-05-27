# GigFinder UI Redesign — Raycast-Inspired

**Date:** 2026-05-27
**Status:** Approved
**Scope:** Full frontend redesign — home, search, perfiles, bandas, venues, dashboard, navbar

---

## Objetivo

Evolucionar GigFinder desde un estilo glassmorphism/glow genérico hacia un diseño dark editorial limpio inspirado en Raycast: tipografía fuerte, espaciado generoso, animaciones cuidadas y fluidas, sin efectos decorativos vacíos. Funciona bien en todos los dispositivos.

---

## 1. Sistema de Tokens

### Colores

```css
--background: #0d0d0d;
--surface: #141414;
--surface-raised: #1a1a1a;
--border: #262626;
--border-hover: #404040;
--accent: #7c3aed;
--accent-hover: #8b5cf6;
--accent-subtle: rgba(124, 58, 237, 0.08);
--text-primary: #ededed;
--text-secondary: #8c8c8c;
--text-muted: #525252;
```

**Eliminaciones:** todas las variables `--glass-*`, `--card`, `--muted`, `--foreground`, glows de color.

### Tipografía

- Fuente: Inter con `font-feature-settings: "cv02", "cv03", "cv04"`
- Hero h1: `clamp(3rem, 8vw, 6rem)`, `font-weight: 900`, `line-height: 1.05`
- h2: `clamp(1.75rem, 4vw, 2.5rem)`, `font-weight: 700`, `line-height: 1.15`
- Body: `1rem`, `font-weight: 400`, `line-height: 1.6`
- Captions/labels: `0.8125rem`, `font-weight: 400`, `color: var(--text-muted)`
- Eliminar `tracking-tight` genérico — solo en h1/hero

### Espaciado

Sistema 8px estricto: `8 / 16 / 24 / 32 / 48 / 64 / 96 / 128px`.
Separación mínima entre secciones del home: `96px`.
Max-width contenido: `1120px`.

---

## 2. Animaciones e Interacciones

### Regla principal

Cada animación tiene un propósito declarado. Sin propósito → sin animación.

### Easing

```css
--ease-ui: cubic-bezier(0.25, 0, 0, 1);
```

Única curva para toda la UI. Sin `ease-in`. Sin bounce. Sin elastic.

### Duraciones

| Elemento | Duración |
|---|---|
| Botones (press feedback) | 120ms |
| Hover de cards / bordes | 150ms |
| Tooltips, pequeños popovers | 150ms |
| Dropdowns, selects | 180ms |
| Modales, drawers | 220ms |
| Entradas de lista (stagger) | 200ms base + 30ms por item |

Nada por encima de `300ms` en interacciones frecuentes.

### Botones

```css
.btn {
  transition: background 150ms var(--ease-ui), transform 120ms var(--ease-ui);
}
.btn:active {
  transform: scale(0.97);
}
```

Sin `hover:-translate-y`. Sin glow en hover.

### Cards / listas

- Hover: `border-color` de `--border` a `--border-hover` + `background` hacia `--surface-raised`
- Sin `translateY` en hover
- Stagger de entrada: `opacity 200ms` + `translateY(8px → 0)`, `30ms` entre items, `once: true`

### Scroll animations

- Solo `opacity` + `translateY(12px → 0)` en secciones del home
- `IntersectionObserver` con `once: true`
- Sin animaciones en loop permanente

### Responsive / touch

- Todos los hover states gated: `@media (hover: hover) and (pointer: fine)`
- Mobile: solo `:active scale(0.97)` como feedback táctil
- `will-change: transform` solo justo antes de animar, nunca permanente

### Framer Motion

Usar solo donde haya interacción dinámica real: modales, drawers, drag. Eliminar del home/landing — CSS puro.

---

## 3. Layout por Páginas

### Home / Landing

**Hero**
- Fondo `#0d0d0d` con `DotGrid` CSS estático (sin animación). Sin mesh gradient animado.
- Tipografía ocupa 70% del espacio visual.
- Un CTA primario sólido + un CTA secundario ghost (sin glow).
- Eliminar notas flotantes animadas (♪ ♫ ♩).
- Eliminar `AudioWave` del hero.

**Features**
- Grid `2×2` desktop / `1` col mobile.
- Cards planas: `bg-[--surface] border border-[--border]`, icono pequeño sólido, título bold, descripción en `--text-secondary`.
- Hover: solo cambio de borde.

**Cómo funciona**
- Números `01/02/03` grandes en tipografía light como separadores visuales.
- Layout horizontal desktop / vertical mobile.
- Sin círculos elaborados con `box-shadow`.

**Géneros**
- Pills limpias sin glass.
- Hover: `border-color: --accent` + `background: --accent-subtle`.

---

### Search

- Barra búsqueda fija top, full-width.
- Filtros (tipo/ciudad/género) como pills/tabs debajo de la barra.
- En mobile: filtros como dropdown o bottom sheet — no panel lateral.
- Resultados: grid `3` col desktop / `2` tablet / `1` mobile.
- Cards: avatar cuadrado, nombre bold, badge de rol coloreado, ciudad en `--text-muted`.
- "Cargar más" en lugar de paginación clásica.

---

### Perfiles / Bandas / Venues

- Banner full-width `h-48`, avatar superpuesto bottom-left.
- Nombre + rol + ciudad en línea horizontal.
- Botón acción (Reservar / Contactar / Unirse) fijo arriba-derecha en desktop, full-width debajo del header en mobile.
- Contenido en columna única `max-w-2xl` centrada.
- Secciones separadas por `border-top: 1px solid var(--border)`.
- `AudioWave` puede estar en perfiles músico/banda — contextual, no decorativo.

---

### Dashboard / Mis bandas

- Bandas como filas de lista, no grid de cards.
- Filas: avatar pequeño + nombre + géneros + city + acciones inline.
- Invitaciones pendientes: banner top destacado, visualmente diferenciado.

---

### Navbar

- Eliminar iconos de los links de texto en desktop (redundantes con el label).
- Logout: solo icono, sin label.
- Mobile: añadir `BottomNav` con 4 items: Explorar / Mensajes / Solicitudes / Perfil.
- Navbar desktop: sin cambio estructural.

---

## 4. Componentes

### Nuevos / reemplazados

| Actual | Nuevo | Cambio |
|---|---|---|
| `GlassCard` | `Card` | Surface plana, sin backdrop-filter |
| `MeshBackground` | `DotGrid` | CSS estático, sin animación |
| `AudioWave` | Mantener | Solo en contexto músico/banda |
| `PageTransition` | Eliminar | Sin transición de página — Next.js App Router maneja esto nativamente |
| `btn-primary-glow` | `.btn-primary` | Sólido, sin glow |

### Nuevo: `BottomNav.tsx`

Navegación mobile inferior, visible solo `<md`. Items: Explorar, Mensajes, Solicitudes, Perfil. Fondo `--surface`, borde top `--border`. Item activo: `--accent`.

---

## 5. globals.css — Cambios

- Reescribir variables CSS completas (ver Sección 1)
- Eliminar: `.glass`, `.glass-blur`, `.glow-text`, `.btn-primary-glow`, `.mesh-bg`, `.noise`, `@keyframes mesh-drift`
- Añadir: `--ease-ui`, escala tipográfica con `clamp()`, `@starting-style` para toasts/modales
- Mantener: `.audio-bar` (reubicado en perfiles)

---

## 6. Archivos Afectados

| Archivo | Tipo de cambio |
|---|---|
| `frontend/src/app/globals.css` | Reescritura completa |
| `frontend/src/components/ui/GlassCard.tsx` | Reemplazar por `Card.tsx` |
| `frontend/src/components/ui/MeshBackground.tsx` | Reemplazar por `DotGrid.tsx` |
| `frontend/src/components/layout/Navbar.tsx` | Limpieza + añadir `BottomNav.tsx` |
| `frontend/src/components/layout/BottomNav.tsx` | Nuevo |
| `frontend/src/app/page.tsx` | Reescritura layout |
| `frontend/src/app/search/page.tsx` | Refactor layout y cards |
| `frontend/src/app/profiles/[id]/page.tsx` | Refactor header de perfil |
| `frontend/src/app/bands/[id]/page.tsx` | Refactor header de banda |
| `frontend/src/app/venues/[id]/page.tsx` | Refactor header de venue |
| `frontend/src/app/dashboard/page.tsx` | Layout lista vs grid |

---

## Criterios de éxito

- Ningún elemento pasa el "AI slop test" (taste-skill)
- Todas las animaciones tienen duración ≤ 300ms con `--ease-ui`
- Sin `ease-in`, sin glow, sin glassmorphism en páginas internas
- Responsive funcional en 320px, 768px, 1280px sin scroll horizontal
- `BottomNav` presente y funcional en mobile
- `LCP` no empeora respecto al estado actual
