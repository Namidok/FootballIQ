interface Props {
  crestUrl?: string | null
  name: string
  size?: number
}

export default function TeamCrest({ crestUrl, name, size = 32 }: Props) {
  if (!crestUrl) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full font-semibold"
        style={{
          width: size,
          height: size,
          background: 'var(--surface-2)',
          color: 'var(--text-muted)',
          fontSize: size * 0.4,
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={crestUrl}
      alt={`${name} crest`}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      loading="lazy"
    />
  )
}
