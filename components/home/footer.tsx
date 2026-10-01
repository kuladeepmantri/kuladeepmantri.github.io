'use client'

import { useRef, useState } from 'react'
import { ArrowUp } from './icons'
import { ThemeSwitch } from './theme'
import { LocalTime } from './time'

type Copy = 'idle' | 'copied' | 'selected'

const SAID: Record<Copy, string> = {
  idle: '',
  copied: 'Email address copied',
  selected: 'Email address selected. Press Command C or Control C to copy it.',
}

export function Footer({
  email,
  year,
  elsewhere,
}: {
  email: string
  year: string
  elsewhere: { label: string; href: string }[]
}) {
  const [copy, setCopy] = useState<Copy>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const address = useRef<HTMLAnchorElement>(null)

  async function onCopy() {
    let done = false
    try {
      await navigator.clipboard.writeText(email)
      done = true
    } catch {
      // Clipboard blocked (or missing, in some in-app browsers): select the
      // address so a manual copy is one keystroke.
      const sel = window.getSelection()
      if (address.current && sel) {
        const range = document.createRange()
        range.selectNodeContents(address.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    setCopy(done ? 'copied' : 'selected')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopy('idle'), done ? 1600 : 4000)
  }

  return (
    <footer className="footer" id="contact">
      <div className="fgrid">
        <div>
          <div className="cap">Email</div>
          <div className="body">
            <a ref={address} className="ul email" href={`mailto:${email}`}>
              {email}
            </a>
          </div>
          <div>
            <button type="button" className="seg copy" onClick={onCopy}>
              {copy === 'copied' ? 'Copied' : copy === 'selected' ? 'Selected' : 'Copy address'}
            </button>
            <span className="sr-only" aria-live="polite">
              {SAID[copy]}
            </span>
          </div>
        </div>
        <div>
          <div className="cap" id="footer-elsewhere">
            Elsewhere
          </div>
          <ul className="body links" aria-labelledby="footer-elsewhere">
            {elsewhere.map((l) => (
              <li key={l.href}>
                <a className="ul" href={l.href} rel="me">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="clock-col">
          <div className="cap">Local time</div>
          <div className="body">
            <LocalTime />
          </div>
        </div>
      </div>
      <div className="mute fbottom">
        <span>© {year} Kuladeep Mantri</span>
        <ThemeSwitch />
        <a className="ul" href="#top">
          Back to top
          <ArrowUp />
        </a>
      </div>
    </footer>
  )
}
