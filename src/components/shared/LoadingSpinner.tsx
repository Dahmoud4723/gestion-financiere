export function LoadingSpinner({ size = 'md', fullPage }: { size?: 'sm' | 'md' | 'lg'; fullPage?: boolean }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
  const spinner = (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} animate-spin rounded-full border-2 border-slate-600 border-t-blue-500`}
      />
    </div>
  )
  if (fullPage) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        {spinner}
      </div>
    )
  }
  return spinner
}
