export function LoadingSpinner({ size = 'md', fullPage }: { size?: 'sm' | 'md' | 'lg'; fullPage?: boolean }) {
  const s = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'

  const spinner = (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className={`${s} absolute rounded-full bg-blue-500/20 blur-md`} />
      {/* Spinner */}
      <div className={`${s} animate-spin rounded-full border-2 border-transparent border-t-blue-400 border-r-indigo-400`} />
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4">
        {spinner}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-blue-500/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return spinner
}
