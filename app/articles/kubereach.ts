import type { ArticleBlock } from '@/app/signals'

// Long-form writeup for the kubereach entry. Kept out of signals.ts so the data
// file stays scannable. Authored in a plain first-person voice; the diagrams are
// inline SVG/ASCII themed with the site's CSS vars so they follow light/dark.

const splitVantageDiagram = `
<svg viewBox="0 0 560 466" role="img" aria-label="Diagram: a token read from a pod inside an EKS cluster is carried to a laptop, traded with AWS STS for temporary credentials, and used off-box with exactly the pod's cloud permissions." style="width:100%;height:auto;font-family:var(--font-mono),ui-monospace,Menlo,monospace">
  <defs>
    <marker id="kr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)"/>
    </marker>
  </defs>

  <!-- 1. cluster / pod -->
  <rect x="40" y="16" width="480" height="76" rx="8" fill="var(--bg-elevated)" stroke="var(--border)"/>
  <text x="280" y="40" text-anchor="middle" font-size="11.5" letter-spacing="0.06em" fill="var(--text)">EKS CLUSTER &#183; across town</text>
  <text x="280" y="60" text-anchor="middle" font-size="11" fill="var(--text-muted)">one pod holds a golden key</text>
  <text x="280" y="78" text-anchor="middle" font-size="11" fill="var(--status-paused)">IRSA token &#183; /var/run/secrets/&#8230;</text>

  <line x1="150" y1="96" x2="150" y2="132" stroke="var(--text-muted)" stroke-width="1.5" marker-end="url(#kr-arrow)"/>
  <text x="166" y="118" font-size="11" fill="var(--text-secondary)">1 &#183; read the token off the pod's disk</text>

  <!-- 2. laptop -->
  <rect x="40" y="136" width="480" height="64" rx="8" fill="var(--bg-elevated)" stroke="var(--border)"/>
  <text x="280" y="162" text-anchor="middle" font-size="11.5" letter-spacing="0.06em" fill="var(--text)">YOUR LAPTOP &#183; off-box</text>
  <text x="280" y="182" text-anchor="middle" font-size="11" fill="var(--text-muted)">no live connection back to the cluster</text>

  <line x1="150" y1="204" x2="150" y2="240" stroke="var(--text-muted)" stroke-width="1.5" marker-end="url(#kr-arrow)"/>
  <text x="166" y="226" font-size="11" fill="var(--text-secondary)">2 &#183; trade it with AWS, request sent unsigned</text>

  <!-- 3. STS -->
  <rect x="40" y="244" width="480" height="64" rx="8" fill="var(--bg-elevated)" stroke="var(--accent)"/>
  <text x="280" y="270" text-anchor="middle" font-size="11.5" letter-spacing="0.06em" fill="var(--text)">AWS STS</text>
  <text x="280" y="290" text-anchor="middle" font-size="11" fill="var(--text-muted)">AssumeRoleWithWebIdentity</text>

  <line x1="150" y1="312" x2="150" y2="348" stroke="var(--text-muted)" stroke-width="1.5" marker-end="url(#kr-arrow)"/>
  <text x="166" y="334" font-size="11" fill="var(--text-secondary)">3 &#183; live temporary credentials, 1 hour</text>

  <!-- 4. result -->
  <rect x="40" y="352" width="480" height="96" rx="8" fill="var(--bg-elevated)" stroke="var(--border)"/>
  <text x="280" y="378" text-anchor="middle" font-size="11.5" letter-spacing="0.06em" fill="var(--text)">YOU ARE NOW THE POD'S IAM ROLE</text>
  <rect x="62" y="394" width="210" height="30" rx="6" fill="none" stroke="var(--status-active)"/>
  <text x="167" y="413" text-anchor="middle" font-size="11" fill="var(--status-active)">S3 read &#183; allowed</text>
  <rect x="290" y="394" width="210" height="30" rx="6" fill="none" stroke="var(--border)"/>
  <text x="395" y="413" text-anchor="middle" font-size="11" fill="var(--text-muted)">list IAM users &#183; denied</text>
</svg>
`.trim()

export const kubereachArticle: ArticleBlock[] = [
  {
    kind: 'prose',
    text: "You get a shell in one container. That is the whole starting position. One room, somewhere inside a building you cannot see the rest of, and the only honest question is: what can I actually reach from here? Not in theory. From this exact spot, with this one stolen key.",
  },
  {
    kind: 'prose',
    text: "kubereach was my answer to that question. Drop a single binary into the foothold, let it map what your identity can really touch, work out the shortest path to the keys that matter, and then follow that path out of the cluster and into the cloud account sitting behind it. One run, one report, honest about what it could and could not see.",
  },
  {
    kind: 'prose',
    text: "Partway in, I found out someone had already built most of it. A tool called k8scout shipped the same idea a few months earlier. That could have been the end of the project. Instead it changed the question I was asking, from 'can I build this' (clearly yes) to 'is any of it actually real, or does it just read well in a README?' So before writing a single line of the real product, I went and tried to break the two claims that scared me most. If either one was hollow, the whole thing was hollow.",
  },

  { kind: 'heading', text: 'Bet one: the front desk lies to you' },
  {
    kind: 'prose',
    text: "Picture the cluster as a building with a front desk, which is the Kubernetes API server. Almost every tool in this space walks up and asks the desk one polite question: what am I allowed to do here? Then it trusts the answer. On a toy cluster that works fine. On the clusters people actually run in production (EKS, GKE, AKS), it quietly does not, and the reason matters more than it looks.",
  },
  {
    kind: 'prose',
    text: "Managed clusters put a second gatekeeper behind the desk, a webhook the desk itself does not fully understand. So when you ask for the summary of your permissions (a call named SelfSubjectRulesReview), the desk gives you an honest but partial answer: here is what I know about, but I cannot see everything back there. Any tool that trusts that summary will tell you a stolen identity is weaker than it really is. It misses real, exploitable access and never even knows it happened.",
  },
  {
    kind: 'prose',
    text: "I built the smallest setup that would drag the disagreement into the open: a local cluster wired with that same two-gatekeeper chain. The hidden webhook secretly grants my foothold account exactly one thing, permission to read the secrets in a locked-off namespace. The normal permission system grants it something completely different, list the pods and nothing else. The two sources of truth contradict each other on purpose, which is precisely the situation a real managed cluster puts you in.",
  },
  {
    kind: 'ascii',
    title: 'what each method actually reported',
    art: `SelfSubjectRulesReview   (the summary every tool trusts)
   secrets/restricted  ->  not in the list
   [INCOMPLETE: the webhook's rules are hidden from this call]
   ...so a tool trusting this reports "no access"

SelfSubjectAccessReview  (the exact yes/no question)
   get secrets/restricted  ->  ALLOW
   [confirmed against the real cluster: 200 OK, secret read]`,
  },
  {
    kind: 'prose',
    text: "The summary call came back flagged INCOMPLETE and effectively said no. The precise call, the one that asks the door a single yes-or-no question about one specific action (SelfSubjectAccessReview), said yes. Reality agreed with the precise one: the secret came back, 200 OK. That is a genuine read that every summary-trusting tool, the existing competitor included, walks straight past.",
  },
  {
    kind: 'prose',
    text: "So the correct way to size up a foothold is to stop trusting the summary and instead ask the door the exact question for each action you care about. It costs you. On my laptop, sweeping around ninety of those checks one at a time took roughly seventeen seconds, which means a real tool has to fan them out in parallel to stay usable. But slow and correct beats fast and wrong, especially on the exact clusters people are paid to get into.",
  },

  { kind: 'heading', text: 'Bet two: carrying a key out of the building' },
  {
    kind: 'prose',
    text: "The second bet was the flashy one. Some pods carry what I think of as a golden key, an IRSA token. It opens nothing inside the building. What it opens is the company's warehouses across town, which is the AWS account behind the cluster. The question I wanted a real answer to: can you take that key out of the building completely and use it from your own laptop, with no live connection back to the cluster at all?",
  },
  { kind: 'diagram', title: 'the split-vantage pivot, end to end', svg: splitVantageDiagram },
  {
    kind: 'prose',
    text: "I proved the plumbing locally first, against a fake AWS running on my own machine, just to get the exact call shape right. That worked. But a fake target proves nothing about the real one, so I did the whole thing for real, against real infrastructure and real money.",
  },
  {
    kind: 'prose',
    text: "I opened a fresh AWS account, running on credits, and stood up a genuine managed Kubernetes cluster: one cluster named s2-probe in us-east-1, Kubernetes 1.34, a single small node. The one setting that carries the whole trick is that I switched on its OIDC provider, which is the trust anchor that makes the golden key mean anything to AWS in the first place.",
  },
  {
    kind: 'steps',
    items: [
      "Played the careless owner. Created an IAM role tied to the cluster's identity, scoped to read-only S3, and attached it to a Kubernetes service account.",
      'Ran a throwaway busybox pod using that account. EKS automatically injected the golden key into the pod as a file.',
      "Switched hats to the intruder. I am 'in the room', so the key is just a file on disk. I read it straight off the pod.",
      'Copied it to my laptop and, from there, off-box, traded it directly with AWS for live temporary credentials. At that moment there was no connection back to the cluster.',
    ],
  },
  {
    kind: 'callout',
    label: 'the assumption that turned out wrong',
    text: "My local test had signed the request to AWS with my own credentials, and real AWS flatly rejects that. The entire point is that the stolen token is the credential, so the request has to go out unsigned. It was a four-line fix, but it is exactly the kind of detail that decides whether the attack works or quietly fails, and I only found it by doing it for real instead of trusting the mock.",
  },
  {
    kind: 'prose',
    text: "Then the part that made it land. With those credentials I asked AWS who am I, and it answered with the pod's own IAM role, wearing the session name I had handed it. I tried to read S3: allowed. I tried to list the account's IAM users: denied. Which is exactly right. I was holding the pod's cloud powers, no more and no less, on my laptop, across town from a cluster I was no longer even talking to. Then I tore the whole thing down, because a real cluster costs real money by the hour and the entire proof had cost about a coffee.",
  },
  {
    kind: 'callout',
    label: 'why this one has a shelf life',
    text: "This specific trick only works with IRSA. AWS's newer default, Pod Identity, binds the key to the cluster so it cannot be carried out at all. So the most impressive part of the demo is the part that is slowly aging out as clusters move to the new default. I would rather say that plainly than sell a trick with a quiet expiry date on it.",
  },

  { kind: 'heading', text: 'So is it worth building?' },
  {
    kind: 'prose',
    text: "Here is where I actually landed, and I am trying to be honest rather than kind to my own idea. The category already has a decent tool sitting in it. The flashiest capability is aging out. And the parts that sound hard turned out to be mostly solved and importable. As a race to ship a slightly better version of a thing that already exists, it is not worth a month of my life, and pretending otherwise would just waste that month.",
  },
  {
    kind: 'prose',
    text: "Bet one is a different story though. The fact that nearly every tool here quietly under-reports what a stolen identity can do, on exactly the clusters that matter most, is a real and useful finding. That is the piece worth keeping, and it may be worth more as a clear written explanation than as one more binary fighting for stars.",
  },
  {
    kind: 'prose',
    text: "So this is not dead, and it is not shipped. It is parked as a live idea while I work out the honest version of it: lead with the correctness finding, build the community-extensible piece nobody else has bothered with, and drop the demo that is on its way out. I am still brainstorming what shape that actually takes. Either way, I came out understanding the full path from a Kubernetes API's authorization internals down to a single AWS call, because I built it and broke it myself rather than reading about it. That part I do not regret for a second.",
  },
  {
    kind: 'callout',
    label: 'where this belongs',
    text: 'Every bit of this ran against my own lab and a throwaway AWS account I owned and then deleted. That is the only place any of it belongs. It exists to understand and defend these paths, not to point at anyone else.',
  },
]
