import { ElementType, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  hover?: boolean
}

export default function Card({
  children,
  className = '',
  as: Tag = 'div',
  hover = false,
  ...props
}: CardProps) {
  return (
    <Tag
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-xl hover-lift
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  )
}
