'use client'

import { useRef, useState } from 'react'

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Clipboard blocked: select the address so a manual copy is one keystroke.
      const link = document.getElementById('email-address')
      const sel = window.getSelection()
      if (link && sel) {
        const range = document.createRange()
        range.selectNodeContents(link)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      <button type="button" className="pill" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Email address copied' : ''}
      </span>
    </>
  )
}
