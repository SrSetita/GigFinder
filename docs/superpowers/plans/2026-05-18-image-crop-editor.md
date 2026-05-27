# Image Crop Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a crop/zoom/pan modal between file selection and upload for avatar (1:1) and banner (16:5) images.

**Architecture:** A reusable `ImageCropModal` component uses `react-easy-crop` for the crop UI and Canvas API to produce a cropped `Blob`. Each page intercepts avatar/banner file selection, opens the modal, and only uploads after the user confirms. Media gallery uploads are unaffected.

**Tech Stack:** React 19, Next.js 16, TypeScript, `react-easy-crop` v5, Canvas API

---

### Task 1: Create ImageCropModal component

**Files:**
- Create: `frontend/src/components/ui/ImageCropModal.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

interface ImageCropModalProps {
  image: string
  aspect: number
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas empty')),
      'image/jpeg',
      0.92
    )
  })
}

export default function ImageCropModal({ image, aspect, onConfirm, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const blob = await getCroppedImg(image, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="bg-[#12121f] px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={applying}
            className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {applying ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/ImageCropModal.tsx
git commit -m "feat: add ImageCropModal component with react-easy-crop"
```

---

### Task 2: Wire ImageCropModal in settings/profile/page.tsx

**Files:**
- Modify: `frontend/src/app/settings/profile/page.tsx`

Context: The file imports `useAuth`, `getToken`, `setSession`, and has `handleAvatarFile(file: File)` and `handleBannerFile(file: File)`. Currently both handlers upload immediately. We replace them so they open the crop modal, and add blob upload functions.

- [ ] **Step 1: Add ImageCropModal import**

Find the existing imports block (around line 9 where DropZone is imported). Add:
```tsx
import ImageCropModal from '@/components/ui/ImageCropModal'
```

- [ ] **Step 2: Add cropState**

Find where `uploadingAvatar` state is declared (around line 73). Add after it:
```tsx
const [cropState, setCropState] = useState<{
  image: string
  aspect: number
  onConfirm: (blob: Blob) => void
} | null>(null)
```

- [ ] **Step 3: Replace handleAvatarFile and handleBannerFile**

Find and replace the entire `handleAvatarFile` function:

Old:
```tsx
const handleAvatarFile = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const url = await uploadFile(file, '/api/upload/avatar')
      setAvatarPreview(url)
      if (user) {
        const updated = { ...user, profile: { ...user.profile, avatarUrl: url } }
        setUser(updated)
        const token = getToken()
        if (token) setSession(token, updated)
      }
    } catch {
      setAvatarPreview(profile?.avatarUrl || null)
    } finally {
      setUploadingAvatar(false)
    }
  }
```

New:
```tsx
const uploadAvatarBlob = async (blob: Blob) => {
    setAvatarPreview(URL.createObjectURL(blob))
    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('file', blob, 'avatar.jpg')
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const url: string = data.url
      setAvatarPreview(url)
      if (user) {
        const updated = { ...user, profile: { ...user.profile, avatarUrl: url } }
        setUser(updated)
        const tok = getToken()
        if (tok) setSession(tok, updated)
      }
    } catch {
      setAvatarPreview(profile?.avatarUrl || null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFile = (file: File) => {
    setCropState({ image: URL.createObjectURL(file), aspect: 1, onConfirm: uploadAvatarBlob })
  }
```

Find and replace the entire `handleBannerFile` function:

Old:
```tsx
const handleBannerFile = async (file: File) => {
    setBannerPreview(URL.createObjectURL(file))
    setUploadingBanner(true)
    try {
      const url = await uploadFile(file, '/api/upload/banner')
      setBannerPreview(url)
    } catch {
      setBannerPreview(profile?.bannerUrl || null)
    } finally {
      setUploadingBanner(false)
    }
  }
```

New:
```tsx
const uploadBannerBlob = async (blob: Blob) => {
    setBannerPreview(URL.createObjectURL(blob))
    setUploadingBanner(true)
    try {
      const form = new FormData()
      form.append('file', blob, 'banner.jpg')
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/banner`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setBannerPreview(data.url)
    } catch {
      setBannerPreview(profile?.bannerUrl || null)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleBannerFile = (file: File) => {
    setCropState({ image: URL.createObjectURL(file), aspect: 3.2, onConfirm: uploadBannerBlob })
  }
```

- [ ] **Step 4: Render ImageCropModal in JSX**

Find the return statement. Just before the closing `</div>` of the outermost container (or right before the `<form>`), add:

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

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/seta/VsCodeProjects/GigFinder/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/settings/profile/page.tsx
git commit -m "feat: image crop modal for avatar and banner in profile settings"
```

---

### Task 3: Wire ImageCropModal in bands/[id]/manage/page.tsx

**Files:**
- Modify: `frontend/src/app/bands/[id]/manage/page.tsx`

Context: The file has `handleAvatarFile(file: File)`, `handleBannerFile(file: File)`, and `uploadFile(file, endpoint)` which returns `any` (full JSON response). The band page uses `toast()` for feedback.

- [ ] **Step 1: Add ImageCropModal import**

Find the existing imports (around line 9). Add:
```tsx
import ImageCropModal from '@/components/ui/ImageCropModal'
```

- [ ] **Step 2: Add cropState**

Find where `uploadingAvatar` state is declared (around line 68). Add after it:
```tsx
const [cropState, setCropState] = useState<{
  image: string
  aspect: number
  onConfirm: (blob: Blob) => void
} | null>(null)
```

- [ ] **Step 3: Replace handleAvatarFile and handleBannerFile**

Find and replace the entire `handleAvatarFile` function:

Old:
```tsx
const handleAvatarFile = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const data = await uploadFile(file, `/api/upload/band/${id}/avatar`)
      setAvatarPreview(data.url)
      toast('Avatar actualizado', 'success')
    } catch {
      setAvatarPreview(band?.avatarUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingAvatar(false) }
  }
```

New:
```tsx
const uploadAvatarBlob = async (blob: Blob) => {
    setAvatarPreview(URL.createObjectURL(blob))
    setUploadingAvatar(true)
    try {
      const form = new FormData()
      form.append('file', blob, 'avatar.jpg')
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/band/${id}/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setAvatarPreview(data.url)
      toast('Avatar actualizado', 'success')
    } catch {
      setAvatarPreview(band?.avatarUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingAvatar(false) }
  }

  const handleAvatarFile = (file: File) => {
    setCropState({ image: URL.createObjectURL(file), aspect: 1, onConfirm: uploadAvatarBlob })
  }
```

Find and replace the entire `handleBannerFile` function:

Old:
```tsx
const handleBannerFile = async (file: File) => {
    setBannerPreview(URL.createObjectURL(file))
    setUploadingBanner(true)
    try {
      const data = await uploadFile(file, `/api/upload/band/${id}/banner`)
      setBannerPreview(data.url)
      toast('Banner actualizado', 'success')
    } catch {
      setBannerPreview(band?.bannerUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingBanner(false) }
  }
```

New:
```tsx
const uploadBannerBlob = async (blob: Blob) => {
    setBannerPreview(URL.createObjectURL(blob))
    setUploadingBanner(true)
    try {
      const form = new FormData()
      form.append('file', blob, 'banner.jpg')
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/band/${id}/banner`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setBannerPreview(data.url)
      toast('Banner actualizado', 'success')
    } catch {
      setBannerPreview(band?.bannerUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingBanner(false) }
  }

  const handleBannerFile = (file: File) => {
    setCropState({ image: URL.createObjectURL(file), aspect: 3.2, onConfirm: uploadBannerBlob })
  }
```

- [ ] **Step 4: Render ImageCropModal in JSX**

Find the outermost `return (` in the component. Inside the outermost `<div>`, add after the closing `</form>`:

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

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/seta/VsCodeProjects/GigFinder/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no errors (or only pre-existing unrelated errors).

- [ ] **Step 6: Commit**

```bash
git add "frontend/src/app/bands/[id]/manage/page.tsx"
git commit -m "feat: image crop modal for avatar and banner in band manage"
```
