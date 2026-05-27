import { HTMLAttributes } from 'react'

interface DotGridProps extends HTMLAttributes<HTMLDivElement> {}

export default function DotGrid({ children, className = '', ...props }: DotGridProps) {
  return (
    <div className={`dot-grid ${className}`} {...props}>
      {children}
    </div>
  )
}
