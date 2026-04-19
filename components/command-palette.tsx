'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { DialogTitle } from '@radix-ui/react-dialog'
import {
  Home,
  Layout,
  Smartphone,
  Users,
  Shield,
  Globe,
  Mail,
  Github,
} from 'lucide-react'
import { EMAIL, SOCIAL_LINKS, SIGNALS as PROJECTS } from '@/app/signals'

interface CommandPaletteProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter()
  const [emailCopied, setEmailCopied] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!openRef.current)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  // Custom event from nav button
  useEffect(() => {
    const handleToggle = () => setOpen(true)
    document.addEventListener('toggle-cmdk', handleToggle)
    return () => document.removeEventListener('toggle-cmdk', handleToggle)
  }, [setOpen])

  useEffect(() => {
    if (!open) setEmailCopied(false)
  }, [open])

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
      setOpen(false)
    },
    [router, setOpen],
  )

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setEmailCopied(true)
      setTimeout(() => {
        setEmailCopied(false)
        setOpen(false)
      }, 1000)
    } catch {
      // Fallback: clipboard API denied
    }
  }, [setOpen])

  const openGithub = useCallback(() => {
    const gh = SOCIAL_LINKS.find((s) => s.label === 'GitHub')
    if (gh) window.open(gh.link, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }, [setOpen])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
    >
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <div cmdk-overlay="" onClick={() => setOpen(false)} />

      <Command.Input placeholder="Type a command or search..." />

      <Command.List>
        <Command.Empty>No results found</Command.Empty>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => navigate('/')}>
            <Home size={16} />
            <span>Home</span>
          </Command.Item>
          <Command.Item onSelect={() => navigate('/apps')}>
            <Layout size={16} />
            <span>Projects</span>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Projects">
          {PROJECTS.map((project) => {
            const Icon = project.deviceType === 'iphone' ? Smartphone
              : project.status === 'live' ? Globe
              : project.collaborator ? Users
              : Shield
            return (
              <Command.Item key={project.id} onSelect={() => navigate(`/apps/${project.slug}`)}>
                <Icon size={16} />
                <span>{project.name}</span>
              </Command.Item>
            )
          })}
        </Command.Group>

        <Command.Group heading="Connect">
          <Command.Item onSelect={copyEmail}>
            <Mail size={16} />
            <span>{emailCopied ? 'Copied!' : 'Email'}</span>
          </Command.Item>
          <Command.Item onSelect={openGithub}>
            <Github size={16} />
            <span>GitHub</span>
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
