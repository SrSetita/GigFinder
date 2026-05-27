# Drag-and-Drop Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop file upload to every `input[type=file]` in the app (media gallery, avatar, banner).

**Architecture:** Create a reusable `DropZone` wrapper component that overlays a "Suelta aquí" indicator on drag-enter and calls `onFile(file)` on drop. Each page extracts a `handleXxxFile(file: File)` function from its existing change handler, then wraps the relevant UI element with `<DropZone onFile={handleXxxFile}>`.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS (CSS vars for accent color)

---

### Task 1: Create DropZone component

**Files:**
- Create: `frontend/src/components/ui/DropZone.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useRef, useState } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export default function DropZone({ onFile, accept, disabled, children, className }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const accepts = (file: File) => {
    if (!accept) return true
    return accept.split(',').some(type => {
      const t = type.trim()
      if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1))
      return file.type === t
    })
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file && accepts(file)) onFile(file)
  }

  return (
    <div
      className={`relative ${className ?? ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center pointer-events-none">
          <span className="text-[var(--accent)] text-sm font-medium">Suelta aquí</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/DropZone.tsx
git commit -m "feat: add DropZone reusable drag-and-drop component"
```

---

### Task 2: Wire DropZone in profiles/[id]/page.tsx (media gallery)

**Files:**
- Modify: `frontend/src/app/profiles/[id]/page.tsx`

The current `handleMediaUpload` reads from `e.target.files`. Extract the file logic into `uploadMediaFile(file: File)` and delegate from the existing handler.

- [ ] **Step 1: Replace `handleMediaUpload` with split handlers**

Find this block (around line 88):
```tsx
const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setUploading(true)
  try {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('gf_token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (res.ok) {
      const media = await res.json()
      setProfile((prev: any) => ({ ...prev, media: [...(prev.media || []), media] }))
    }
  } finally {
    setUploading(false)
    if (mediaInputRef.current) mediaInputRef.current.value = ''
  }
}
```

Replace with:
```tsx
const uploadMediaFile = async (file: File) => {
  setUploading(true)
  try {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('gf_token')
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (res.ok) {
      const media = await res.json()
      setProfile((prev: any) => ({ ...prev, media: [...(prev.media || []), media] }))
    }
  } finally {
    setUploading(false)
    if (mediaInputRef.current) mediaInputRef.current.value = ''
  }
}

const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  await uploadMediaFile(file)
}
```

- [ ] **Step 2: Add DropZone import**

At the top of the file, add to imports:
```tsx
import DropZone from '@/components/ui/DropZone'
```

- [ ] **Step 3: Wrap media GlassCard with DropZone**

Find the `{/* Right: media */}` section. The outer `<div className="md:col-span-2">` contains the GlassCard. Wrap the entire GlassCard (both the `profile.media?.length > 0` branch and the empty state branch) in a single DropZone:

```tsx
{/* Right: media */}
<div className="md:col-span-2">
  <input
    ref={mediaInputRef}
    type="file"
    accept="image/*,video/*"
    className="hidden"
    onChange={handleMediaUpload}
  />
  <DropZone
    onFile={uploadMediaFile}
    accept="image/*,video/*"
    disabled={uploading || !isOwnProfile}
  >
    {profile.media?.length > 0 ? (
      <GlassCard className="p-5">
        {/* ...existing content unchanged... */}
      </GlassCard>
    ) : (
      <GlassCard className="p-10 text-center text-gray-500">
        {/* ...existing content unchanged... */}
      </GlassCard>
    )}
  </DropZone>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add "frontend/src/app/profiles/[id]/page.tsx"
git commit -m "feat: drag-and-drop media upload on profile page"
```

---

### Task 3: Wire DropZone in settings/profile/page.tsx (avatar + banner)

**Files:**
- Modify: `frontend/src/app/settings/profile/page.tsx`

- [ ] **Step 1: Add DropZone import**

```tsx
import DropZone from '@/components/ui/DropZone'
```

- [ ] **Step 2: Extract file handlers from change handlers**

Find `handleAvatarChange` and `handleBannerChange` (around line 143). Add file-only versions above them:

```tsx
const handleAvatarFile = async (file: File) => {
  setAvatarPreview(URL.createObjectURL(file))
  setUploadingAvatar(true)
  try {
    const url = await uploadFile(file, '/api/upload/avatar')
    setAvatarPreview(url)
  } catch {
    setAvatarPreview(profile?.avatarUrl || null)
  } finally {
    setUploadingAvatar(false)
  }
}

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  await handleAvatarFile(file)
}

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

const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  await handleBannerFile(file)
}
```

- [ ] **Step 3: Wrap banner div with DropZone**

Find the banner `<div className="h-36 ...">` (the one with `onClick={() => bannerInputRef.current?.click()}`). Wrap it:

```tsx
<DropZone onFile={handleBannerFile} accept="image/*" disabled={uploadingBanner} className="block">
  <div
    className="h-36 bg-gradient-to-br from-[var(--accent)]/25 to-white/[0.02] relative cursor-pointer group"
    onClick={() => bannerInputRef.current?.click()}
  >
    {/* ...existing content unchanged... */}
    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
  </div>
</DropZone>
```

- [ ] **Step 4: Wrap avatar div with DropZone**

Find the avatar `<div className="w-20 h-20 rounded-full ...">` (the one with `onClick={() => avatarInputRef.current?.click()}`). Wrap it:

```tsx
<DropZone onFile={handleAvatarFile} accept="image/*" disabled={uploadingAvatar}>
  <div
    className="w-20 h-20 rounded-full border-4 border-[#12121f] bg-[var(--accent)] flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer relative group flex-shrink-0"
    onClick={() => avatarInputRef.current?.click()}
  >
    {/* ...existing content unchanged... */}
    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
  </div>
</DropZone>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/settings/profile/page.tsx
git commit -m "feat: drag-and-drop avatar and banner upload on profile settings"
```

---

### Task 4: Wire DropZone in bands/[id]/manage/page.tsx (avatar + banner + media)

**Files:**
- Modify: `frontend/src/app/bands/[id]/manage/page.tsx`

- [ ] **Step 1: Add DropZone import**

```tsx
import DropZone from '@/components/ui/DropZone'
```

- [ ] **Step 2: Extract file handlers**

Find `handleAvatar`, `handleBanner`, `handleMedia` (around line 113). Replace with:

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

const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return
  await handleAvatarFile(file)
}

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

const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return
  await handleBannerFile(file)
}

const handleMediaFile = async (file: File) => {
  setUploadingMedia(true)
  try {
    const media = await uploadFile(file, `/api/upload/band/${id}/media`)
    setBand((b: any) => ({ ...b, media: [...(b.media ?? []), media] }))
    toast('Archivo subido', 'success')
  } catch { toast('Error al subir archivo', 'error') }
  finally { setUploadingMedia(false); if (mediaRef.current) mediaRef.current.value = '' }
}

const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; if (!file) return
  await handleMediaFile(file)
}
```

- [ ] **Step 3: Wrap banner div with DropZone**

Find the banner `<div className="h-36 ...">` with `onClick={() => bannerRef.current?.click()}`. Wrap it:

```tsx
<DropZone onFile={handleBannerFile} accept="image/*" disabled={uploadingBanner} className="block">
  <div className="h-36 bg-gradient-to-br from-[var(--accent)]/25 to-white/[0.02] relative cursor-pointer group"
    onClick={() => bannerRef.current?.click()}>
    {/* ...existing content unchanged... */}
    <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
  </div>
</DropZone>
```

- [ ] **Step 4: Wrap avatar div with DropZone**

Find the avatar `<div className="w-20 h-20 rounded-2xl ...">` with `onClick={() => avatarRef.current?.click()}`. Wrap it:

```tsx
<DropZone onFile={handleAvatarFile} accept="image/*" disabled={uploadingAvatar}>
  <div className="w-20 h-20 rounded-2xl border-4 border-[#12121f] bg-[var(--accent)]/20 flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer relative group flex-shrink-0"
    onClick={() => avatarRef.current?.click()}>
    {/* ...existing content unchanged... */}
    <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
  </div>
</DropZone>
```

- [ ] **Step 5: Wrap media GlassCard with DropZone**

Find `{/* Media */}` GlassCard. Wrap the entire `<GlassCard className="p-6 flex flex-col gap-4">`:

```tsx
{/* Media */}
<DropZone onFile={handleMediaFile} accept="image/*,video/*,audio/*" disabled={uploadingMedia}>
  <GlassCard className="p-6 flex flex-col gap-4">
    {/* ...existing content unchanged... */}
  </GlassCard>
</DropZone>
```

- [ ] **Step 6: Commit**

```bash
git add "frontend/src/app/bands/[id]/manage/page.tsx"
git commit -m "feat: drag-and-drop upload on band manage page"
```
