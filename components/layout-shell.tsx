'use client'

import { useState } from 'react'
import { CommandPalette } from '@/components/command-palette'
import { KeyboardHelp } from '@/components/keyboard-help'
import { useArrowNav } from '@/hooks/use-arrow-nav'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  useArrowNav(cmdkOpen || helpOpen)

  return (
    <>
      {children}
      <CommandPalette open={cmdkOpen} setOpen={setCmdkOpen} />
      <KeyboardHelp open={helpOpen} setOpen={setHelpOpen} />
    </>
  )
}
