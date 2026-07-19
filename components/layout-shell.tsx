'use client'

import { useState } from 'react'
import { KeyboardHelp } from '@/components/keyboard-help'
import { ScrollTop } from '@/components/ui/scroll-top'
import { useArrowNav } from '@/hooks/use-arrow-nav'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false)
  useArrowNav(helpOpen)

  return (
    <>
      {children}
      <ScrollTop />
      <KeyboardHelp open={helpOpen} setOpen={setHelpOpen} />
    </>
  )
}
