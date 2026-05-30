export default function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`${className} animate-spin rounded-full border-2 border-accent border-t-transparent`} />
  )
}
