export function Avatar({ size }: { size: 28 | 40 | 48 | 64 | 80 | 120 }) {
  return (
    <picture>
      <source srcSet="/images/avatar.webp" type="image/webp" />
      <img
        src="/images/avatar.jpg"
        width={size}
        height={size}
        alt=""
        className="avatar"
        style={{ width: size, height: size }}
      />
    </picture>
  )
}
