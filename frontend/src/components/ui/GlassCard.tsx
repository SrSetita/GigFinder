'use client'

import { motion } from 'framer-motion'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  as?: 'div' | 'section' | 'aside' | 'article'
}

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  as: Tag = 'div',
  ...props
}: GlassCardProps) {
  const base =
    'bg-white/[0.04] border border-white/[0.07] rounded-2xl'

  if (hover) {
    return (
      <motion.div
        whileHover={{
          y: -2,
          borderColor: 'rgba(124,58,237,0.4)',
          boxShadow: glow
            ? '0 0 32px rgba(124,58,237,0.2), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.35)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`${base} ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <Tag className={`${base} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
