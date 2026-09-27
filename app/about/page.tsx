import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/site/avatar'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kuladeep Mantri is a cybersecurity engineer in Michigan who builds apps, AI tools, and cloud infrastructure on the side.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>Cybersecurity engineer · Michigan</span>
        </span>
      </div>
      <h2 className="sr-only">About</h2>

      <p className="p-text about-lead">
        I’m a cybersecurity engineer, and I’m curious about how most things work. Security is my
        field, but I don’t stay inside it.
      </p>

      <section className="about-side" aria-labelledby="about-build">
        <h3 className="lab" id="about-build">
          What I build
        </h3>
        <p className="p-text">
          Apps, AI tools, and the cloud they run on. Lately that’s been{' '}
          <a href="https://github.com/Eval-core/evalcore">evalcore</a>, snapshot testing for LLM
          apps, and <Link href="/apps/kubereach">kubereach</Link> for Kubernetes. Cloud engineering
          is the part I keep coming back to. If something catches my interest, I’ll usually build
          it.
        </p>
      </section>

      <section className="about-side" aria-labelledby="about-work">
        <h3 className="lab" id="about-work">
          At work
        </h3>
        <p className="p-text">
          I work in environments that handle highly sensitive data. I write system security plans,
          assess controls, and track findings until a system is authorized to run. The frameworks
          are NIST 800-53, CJIS, and HIPAA. Assessing a control usually means checking the real
          system, so the work is as technical as it is compliance.
        </p>
      </section>

      <div className="facts two">
        <span className="fact">
          <span>Currently in</span>
          <span>Michigan, USA</span>
        </span>
        <span className="fact">
          <span>Frameworks at work</span>
          <span>NIST 800-53 · CJIS · HIPAA</span>
        </span>
      </div>
    </article>
  )
}
