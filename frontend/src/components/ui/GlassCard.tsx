import { ElementType, HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  hover?: boolean
  glow?: boolean // kept for compat, no longer applies glow
  as?: ElementType
}

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow: _glow,
  as: Tag = 'div',
  ...props
}: GlassCardProps) {
  return (
    <Tag
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-xl
        ${hover ? 'transition-colors duration-150 hover-lift cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  )
}
