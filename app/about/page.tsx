import type { Metadata } from 'next'
import { Avatar } from '@/components/site/avatar'

export const metadata: Metadata = {
  title: 'About',
  description: 'How Kuladeep Mantri got into security, and what he works on now.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>Hyderabad → Michigan</span>
        </span>
      </div>
      <h2 className="sr-only" id="about-title">
        About
      </h2>
      <p className="p-text" style={{ marginTop: 28 }}>
        I got into computers by breaking them: Windows XP first, then Vista, then 7. One night I
        installed Linux without really knowing what it was, and a few years later I was running
        Arch and building my own distro.
      </p>
      <p className="p-text">
        The building came later. Python, then C and C++ with GDB open beside them, then web apps,
        APIs, cloud and Kubernetes. Lately it’s AI: I run and fine-tune open-weight models on my
        own hardware and look for where they break.
      </p>
      <p className="p-text">
        I still work the way I started. I want to know how a thing works, and what it takes to
        make it fail.
      </p>
      <div className="facts">
        <span className="fact">
          <span>From</span>
          <span>Hyderabad, India</span>
        </span>
        <span className="fact">
          <span>Based in</span>
          <span>Michigan, USA</span>
        </span>
        <span className="fact">
          <span>Certified</span>
          <span>CEH, EC-Council</span>
        </span>
      </div>
    </article>
  )
}
