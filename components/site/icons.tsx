/** Small icons, drawn on a 16px grid. */

/** The "current location" arrow, filled, in the page's accent colour. */
export function LocationIcon() {
  return (
    <svg className="ico loc-ico" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13.3 2.05a.55.55 0 0 1 .7.7L9.55 14.1a.55.55 0 0 1-1.04-.06L7.3 8.75 2 7.52a.55.55 0 0 1-.07-1.05Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function XLogo({ size = 13 }: { size?: number }) {
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  )
}
