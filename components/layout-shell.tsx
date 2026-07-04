'use client'

import { useState } from 'react'
import { KeyboardHelp } from '@/components/keyboard-help'
import { useArrowNav } from '@/hooks/use-arrow-nav'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false)
  useArrowNav(helpOpen)

  return (
    <>
      {children}
      <KeyboardHelp open={helpOpen} setOpen={setHelpOpen} />
    </>
  )
}
