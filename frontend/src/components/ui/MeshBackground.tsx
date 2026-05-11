interface MeshBackgroundProps {
  children: React.ReactNode
  className?: string
}

export default function MeshBackground({ children, className = '' }: MeshBackgroundProps) {
  return (
    <div className={`mesh-bg relative overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
