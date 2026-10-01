/**
 * The portrait in the 56px header and 36px post slots: one 168px square (3x
 * the larger slot). public/images/portrait.jpg, 512px, is the JSON-LD image.
 */
export function Portrait({ size, lazy = false }: { size: number; lazy?: boolean }) {
  return (
    <picture>
      <source srcSet="/images/portrait-168.webp" type="image/webp" />
      <img
        className="avatar"
        src="/images/portrait-168.jpg"
        width={size}
        height={size}
        alt=""
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        style={{ width: size, height: size }}
      />
    </picture>
  )
}
