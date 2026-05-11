const DELAYS = ['0s', '0.2s', '0.4s', '0.1s', '0.5s', '0.3s', '0.6s', '0.15s', '0.45s']

export default function AudioWave({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[3px] h-14 ${className}`}>
      {DELAYS.map((delay, i) => (
        <div
          key={i}
          className="audio-bar w-[3px] rounded-full h-full"
          style={{
            background: 'linear-gradient(to top, rgba(124,58,237,0.85), rgba(124,58,237,0.35))',
            animationDelay: delay,
          }}
        />
      ))}
    </div>
  )
}
