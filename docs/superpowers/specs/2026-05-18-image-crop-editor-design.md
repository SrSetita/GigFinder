# Image Crop Editor Design

**Feature:** Modal image editor (crop + zoom + pan) that appears between file selection and upload for avatar and banner images.

**Scope:** `settings/profile/page.tsx` and `bands/[id]/manage/page.tsx` — avatar (1:1) and banner (16:5 = 3.2) uploads only. Media gallery uploads are not cropped.

---

## Component: `ImageCropModal`

**File:** `frontend/src/components/ui/ImageCropModal.tsx`

**Props:**
```ts
image: string           // object URL of the raw selected file
aspect: number          // 1 for avatar, 3.2 for banner
onConfirm: (blob: Blob) => void
onCancel: () => void
```

**Library:** `react-easy-crop` v5 — provides zoom + pan + fixed aspect ratio crop overlay.

**Internals:**
- `crop: Point` state (x/y offset, managed by Cropper)
- `zoom: number` state (1–3, managed by slider + Cropper)
- `croppedAreaPixels: Area` — stored on `onCropComplete` callback
- On "Aplicar": call `getCroppedImg(image, croppedAreaPixels)` → returns `Blob` → call `onConfirm(blob)`
- On "Cancelar": call `onCancel()`

**`getCroppedImg` helper (inside the component file):**
- Creates an `<canvas>` element
- Draws the source image cropped to `croppedAreaPixels` coordinates
- Returns `canvas.toBlob()` as a Promise<Blob> (JPEG, quality 0.92)

**UI layout:**
- Full-screen modal overlay (z-50, dark bg)
- Cropper fills most of viewport height (~70vh)
- Below cropper: zoom slider (range 1–3, step 0.05)
- Bottom bar: "Cancelar" (ghost) + "Aplicar" (accent) buttons

---

## Integration: pages

**Both pages follow identical pattern:**

### New state
```ts
const [cropState, setCropState] = useState<{
  image: string
  aspect: number
  onConfirm: (blob: Blob) => void
} | null>(null)
```

### Intercepted handlers

`handleAvatarFile(file: File)` → instead of uploading:
```ts
setCropState({
  image: URL.createObjectURL(file),
  aspect: 1,
  onConfirm: (blob) => uploadAvatarBlob(blob),
})
```

`handleBannerFile(file: File)` → same pattern with aspect 3.2 and `uploadBannerBlob`.

### Upload blob functions

`uploadAvatarBlob(blob: Blob)` — same logic as current `handleAvatarFile` but receives a `Blob` instead of `File`. Constructs `FormData`, appends blob as `'file'`, posts to the avatar endpoint.

`uploadBannerBlob(blob: Blob)` — same for banner endpoint.

### Modal render
```tsx
{cropState && (
  <ImageCropModal
    image={cropState.image}
    aspect={cropState.aspect}
    onConfirm={(blob) => { setCropState(null); cropState.onConfirm(blob) }}
    onCancel={() => setCropState(null)}
  />
)}
```

---

## Aspect Ratios

| Target | Ratio | Value |
|--------|-------|-------|
| Avatar | 1:1 | `1` |
| Banner | 16:5 | `3.2` |

---

## Out of scope

- Media gallery (photos/videos) — no cropping
- Rotation
- Filters
- Output size constraints (server handles resizing if needed)
