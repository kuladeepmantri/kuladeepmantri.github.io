/** Small line icons, drawn on a 16px grid at 1.5px strokes. */

export function PinIcon() {
  return (
    <svg className="ico" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 14.5c-.2 0-4.75-4.1-4.75-7.75a4.75 4.75 0 0 1 9.5 0C12.75 10.4 8.2 14.5 8 14.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.75" r="1.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
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
