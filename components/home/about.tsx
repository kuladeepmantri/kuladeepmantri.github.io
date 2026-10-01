import { Fragment } from 'react'

// The About text is the owner's own words. Do not edit it.

const FACTS: [string, string][] = [
  ['Focus', 'Application security, cloud security, AI systems'],
  ['Cloud', 'AWS, Azure, Kubernetes'],
  ['Into', 'AI, Kubernetes, security tools'],
  ['Writes', 'Python, Go, C, TypeScript, Rust'],
]

export function About() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <h2 id="about-title">About</h2>
      <p className="mute">
        I’m curious by default and usually building something. Most of my own time goes into apps,
        AI, security ideas, and whatever I’m learning next. The engineering side of that is in the
        Projects list.
      </p>
      <p className="mute">
        <span className="runin">Day job.</span> I’m an IT Security Analyst 3 supporting State of
        Michigan systems that handle sensitive criminal justice, student, and health data. I review
        how those systems are designed and secured, evaluate their system security plans, and assess
        risk against NIST 800-53, the U.S. federal framework for security and privacy controls,
        before they move through security authorization.
      </p>
      <dl className="facts">
        {FACTS.map(([k, v]) => (
          <Fragment key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}
