'use client'

import { useRef, useState } from 'react'

type State = 'idle' | 'copied' | 'selected'

const SAID: Record<State, string> = {
  idle: '',
  copied: 'Email address copied',
  selected: 'Email address selected. Press Command C or Control C to copy it.',
}

export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  async function copy() {
    let done = false
    try {
      await navigator.clipboard.writeText(email)
      done = true
    } catch {
      // Clipboard blocked (or missing, in some in-app browsers): select the
      // address so a manual copy is one keystroke, and try the old command.
      const link = document.getElementById('email-address')
      const sel = window.getSelection()
      if (link && sel) {
        const range = document.createRange()
        range.selectNodeContents(link)
        sel.removeAllRanges()
        sel.addRange(range)
        try {
          done = document.execCommand('copy')
        } catch {
          done = false
        }
      }
    }
    setState(done ? 'copied' : 'selected')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), done ? 1600 : 4000)
  }

  return (
    <>
      <button type="button" className="pill" onClick={copy}>
        {state === 'copied' ? 'Copied' : state === 'selected' ? 'Selected' : 'Copy'}
      </button>
      <span className="sr-only" aria-live="polite">
        {SAID[state]}
      </span>
    </>
  )
}
