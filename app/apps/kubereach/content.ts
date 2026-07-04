// Copy + step data for the kubereach immersive walkthrough. Kept out of the
// components so the story reads in one place and the widgets stay presentational.
// Voice: first person, plain, short. Facts are sourced from the kubereach
// research repo (S1 correctness spike, S2 off-box redemption); the real AWS
// account id is intentionally never included.

export type Hop = {
  id: string
  step: string // "01"
  role: string // short label, e.g. "Foothold"
  name: string
  summary: string
  detail: string // monospace block shown when expanded
  tone: 'rose' | 'muted' | 'allow'
}

export const HERO = {
  eyebrow: 'kubereach',
  headline: 'From one cracked room to the whole cloud account',
  sub: 'You get a shell in a single Kubernetes pod. That is the whole starting position. This walks the two things I proved from there, against real infrastructure, and where I am taking it next.',
  meta: ['Go', 'Kubernetes', 'AWS', 'IRSA', '2 proof spikes'],
}

export const INTRO = {
  lead: 'The starting point',
  paragraphs: [
    'One container. One room, somewhere inside a building you cannot see the rest of. The only honest question is not what the cluster can do in theory. It is what this one stolen key can reach, from this exact spot.',
    'kubereach was my answer: drop a single binary into the foothold, map what your identity can really touch, and follow the trail out of the cluster into the AWS account behind it. Partway in I found a competing tool had already shipped most of it, so instead of building, I went to break the two claims that scared me most. If either was hollow, the whole idea was hollow.',
  ],
}

// ── Bet one: SSRR vs SAR ──────────────────────────────────────────────────
export const SSRR_SAR = {
  intro:
    'Almost every tool here asks the API server one polite question, "what am I allowed to do?", and trusts the answer. On managed clusters (EKS, GKE, AKS) a second gatekeeper sits behind the desk that the desk cannot fully see. So the summary under-reports, and the tool never knows it missed real access.',
  ssrr: {
    key: 'ssrr',
    tab: 'The summary',
    call: 'SelfSubjectRulesReview',
    nick: 'the summary every tool trusts',
    lines: [
      'GET  my rules in namespace: restricted',
      '  pods                 ->  list',
      '  secrets/restricted   ->  (not in the list)',
      '',
      '[INCOMPLETE] the webhook rules are hidden',
      '             from this call',
    ],
    verdict: 'reports "no access"',
    verdictTone: 'deny' as const,
  },
  sar: {
    key: 'sar',
    tab: 'The exact question',
    call: 'SelfSubjectAccessReview',
    nick: 'one yes/no question, per action',
    lines: [
      'CAN-I  get secrets/restricted ?',
      '',
      '  allowed: true',
      '',
      '[confirmed] read against the real cluster',
      '            200 OK, secret returned',
    ],
    verdict: 'ALLOW  ·  the access was real',
    verdictTone: 'allow' as const,
  },
  takeaway:
    'The summary said no. The exact question said yes, and reality agreed: the secret came back, 200 OK. Sweeping around ninety of those precise checks one at a time took roughly seventeen seconds on my laptop, so a real tool has to fan them out. Slow and correct beats fast and wrong, especially on the clusters people are paid to get into.',
}

// ── Bet two: the split-vantage pivot ──────────────────────────────────────
export const ATTACK_INTRO =
  'Some pods carry a golden key, an IRSA token. It opens nothing inside the building. What it opens is the company warehouses across town, the AWS account behind the cluster. The question: can you carry that key out of the building entirely and use it from your own laptop, with no live connection back to the cluster?'

export const HOPS: Hop[] = [
  {
    id: 'pod',
    step: '01',
    role: 'Foothold',
    name: 'A pod, from the inside',
    summary: 'You are in the room. The golden key is just a file on disk.',
    tone: 'rose',
    detail: `# you have a shell in one container
$ ls /var/run/secrets/eks.amazonaws.com/serviceaccount/
token

# IRSA projected token, signed by the cluster's
# OIDC provider, meaningful to AWS, not to the pod.`,
  },
  {
    id: 'read',
    step: '02',
    role: 'Read',
    name: 'Take the key',
    summary: 'Read the token straight off the pod. No cluster API needed.',
    tone: 'muted',
    detail: `$ cat .../serviceaccount/token
eyJhbGciOiJSUzI1NiIsImtpZCI6...

# it is a plain JWT. copy it out.
# nothing here talks to the kube-apiserver.`,
  },
  {
    id: 'laptop',
    step: '03',
    role: 'Off-box',
    name: 'Your laptop, across town',
    summary: 'The token is now on your machine. The cluster is out of the loop.',
    tone: 'muted',
    detail: `# paste the token on your own box.
# there is NO live connection back to the
# cluster from here. the key travels alone.

$ export TOKEN=eyJhbGciOiJSUzI1NiI...`,
  },
  {
    id: 'sts',
    step: '04',
    role: 'Exchange',
    name: 'Trade it with AWS',
    summary: 'AssumeRoleWithWebIdentity. The request goes out unsigned.',
    tone: 'muted',
    detail: `$ aws sts assume-role-with-web-identity \\
    --role-arn arn:aws:iam::<redacted>:role/... \\
    --web-identity-token $TOKEN \\
    --no-sign-request        # the token IS the credential

# the fix that only showed up for real:
# a signed request is rejected. it must go unsigned.`,
  },
  {
    id: 'creds',
    step: '05',
    role: 'Result',
    name: "You are the pod's IAM role",
    summary: "Live temporary credentials, one hour. Exactly the pod's powers, no more.",
    tone: 'allow',
    detail: `$ aws sts get-caller-identity
Arn: .../role/s2-irsa-readonly/<your-session>

$ aws s3 ls               ->  allowed
$ aws iam list-users      ->  AccessDenied

# holding the pod's cloud powers on your laptop,
# across town from a cluster you no longer talk to.`,
  },
]

export const BLAST = {
  intro: "With those credentials I asked AWS who am I, and it answered with the pod's own role. Then I probed the edges of what it could touch.",
  allowed: ['s3:ListBucket', 's3:GetObject'],
  denied: ['iam:ListUsers', 'ec2:*', 'sts:AssumeRole (others)'],
}

// ── The real run ──────────────────────────────────────────────────────────
export const REAL_RUN = {
  intro:
    'I proved the plumbing locally against a fake AWS first, to get the call shape right. A mock proves nothing about the real thing, so I did the whole pivot for real, against real infrastructure and real money.',
  setup: [
    { k: 'Account', v: 'a fresh AWS account, on credits' },
    { k: 'Cluster', v: 's2-probe · EKS · us-east-1' },
    { k: 'Version', v: 'Kubernetes 1.34, one small node' },
    { k: 'The switch', v: 'OIDC provider on, the trust anchor' },
  ],
  steps: [
    {
      hat: 'as the careless owner',
      text: 'Made an IAM role tied to the cluster identity, scoped to read-only S3, and attached it to a service account.',
    },
    {
      hat: 'as the careless owner',
      text: 'Ran a throwaway busybox pod on that account. EKS auto-injected the golden key into the pod as a file.',
    },
    {
      hat: 'as the intruder',
      text: 'I am in the room, so the key is just a file. I read it straight off the pod and copied it to my laptop.',
    },
    {
      hat: 'as the intruder',
      text: 'From my laptop, off-box, traded it with AWS for live credentials. No connection back to the cluster at that moment.',
    },
  ],
  close:
    "AWS answered with the pod's own role wearing my session name. S3: allowed. List IAM users: denied. Exactly right. Then I tore it all down, because a real cluster costs real money by the hour, and the whole proof had cost about a coffee.",
}

// ── How I worked ──────────────────────────────────────────────────────────
export const METHOD = {
  intro: 'Risk-first. Prove the scariest bets as throwaway spikes before writing any product code.',
  stages: [
    {
      tag: 'S1',
      title: 'Correctness, on a local cluster',
      text: 'A kind cluster wired with the two-gatekeeper chain, to drag the SSRR-vs-SAR disagreement into the open. This is the finding worth keeping.',
    },
    {
      tag: 'S2 · phase 1',
      title: 'Plumbing, against a fake AWS',
      text: 'Ran the token exchange against a local mock to get the exact call shape right before spending anything.',
    },
    {
      tag: 'S2 · phase 2',
      title: 'The real pivot, real money',
      text: 'A genuine EKS cluster and a live redemption at AWS STS. The mock had hidden the unsigned-request detail; only the real run surfaced it.',
    },
  ],
}

// ── Where it is now (active WIP) ──────────────────────────────────────────
export const CONCLUSION = {
  paragraphs: [
    'This is where kubereach is right now. The two parts that worried me most both held up against real infrastructure. The one I am most sure about is the correctness finding: nearly every tool here under-reports what a stolen identity can really do on the managed clusters that matter most. That is the piece I want to lead with.',
    'It is still active. The off-box IRSA pivot in the demo narrows as EKS Pod Identity becomes the default, so I am pushing the parts that stay valuable further instead.',
    'If this is your kind of problem, I am glad to have people build on it with me.',
  ],
  scope:
    'Every bit of this ran against my own lab and a throwaway AWS account I owned and then deleted. That is the only place any of it belongs. It exists to understand and defend these paths, not to point at anyone.',
}

// Section registry for the scroll-spy nav.
export const SECTIONS = [
  { id: 'start', label: 'Start' },
  { id: 'front-desk', label: 'The front desk lies' },
  { id: 'carry-out', label: 'Carrying the key out' },
  { id: 'real-run', label: 'The real run' },
  { id: 'how', label: 'How I worked' },
  { id: 'worth', label: 'In progress' },
]
