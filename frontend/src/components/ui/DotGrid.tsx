import { HTMLAttributes, forwardRef } from 'react'

interface DotGridProps extends HTMLAttributes<HTMLDivElement> {}

const DotGrid = forwardRef<HTMLDivElement, DotGridProps>(function DotGrid(
  { children, className = '', ...props },
  ref,
) {
  return (
    <div ref={ref} className={`dot-grid ${className}`} {...props}>
      {children}
    </div>
  )
})

export default DotGrid
