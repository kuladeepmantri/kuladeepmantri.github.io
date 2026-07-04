// Single source for the shipcrew page. Built with Abhishek Manyam.
// Facts verified against the repo. Credit is explicit and generous.

export const HERO = {
  eyebrow: 'shipcrew · KM-2025-0003 · with Abhishek Manyam',
  headline: 'A small crew of agents that build software together',
  sub: 'Instead of one chat with one model, ShipCrew is a Slack-shaped room where named Claude agents talk to each other, take tasks, review each other, and ship. You drop a message in a channel and the right ones pick it up.',
  meta: ['Claude Agent SDK', 'Next.js · Express', 'Socket.io', 'multi-agent'],
}

export const CREDIT = {
  intro: 'Built with Abhishek Manyam, and the split is clean enough to name.',
  mine: 'I laid down the agent platform: the orchestration pipeline, the router that decides who responds, the executor that drives the Claude Agent SDK, the MCP tools, and the streaming.',
  his: 'Abhishek owned auth with JWT, the move off Docker to SQLite so it runs locally with no setup, the login and register flow with onboarding, and the glassmorphic dark redesign of the frontend.',
  link: 'https://www.abhishekmanyam.com/',
}

export const INTRO = {
  paragraphs: [
    'The idea is simple to say and harder to build: what if the unit of work was not one assistant, but a team. A project manager who breaks things down, a frontend and a backend developer who do the work, a reviewer who checks it. Each with its own role, its own memory, its own budget.',
    'So ShipCrew is a chat app where the other people are agents. Priya runs the project. Luna takes the frontend, Marcus the backend, Jasper the fullstack work, and Suki reviews. You address them the way you would in Slack, and they address each other the same way.',
  ],
}

// The crew, for the roster band.
export const CREW = [
  { name: 'Priya', role: 'project manager', at: '@priya' },
  { name: 'Luna', role: 'frontend', at: '@luna' },
  { name: 'Marcus', role: 'backend', at: '@marcus' },
  { name: 'Jasper', role: 'fullstack', at: '@jasper' },
  { name: 'Suki', role: 'reviewer', at: '@suki' },
]

// The routing pipeline hops, for the hero flow.
export const PIPELINE = [
  { key: 'msg', label: 'your message', sub: 'in a channel' },
  { key: 'router', label: 'router', sub: 'mentions · channel · PM' },
  { key: 'exec', label: 'executor', sub: 'Claude Agent SDK' },
  { key: 'stream', label: 'streamed back', sub: 'token by token' },
]

export const ROUTING = {
  intro:
    'When a message lands, the router decides who answers, in order. A broadcast like @all or @team goes to everyone. A direct @mention goes to that agent. Otherwise it falls to whoever owns the channel, and failing that, to Priya. The chosen agents queue, the executor calls Claude for each with that agent’s prompt and a per-turn budget, and the reply streams back token by token.',
  handoff:
    'What makes it feel like a team is that agents trigger each other. A developer moving a task to review pulls in Suki automatically. Priya creating a task with an assignee pulls in that developer. No one has to be told twice.',
}

export const CLOSE = {
  paragraphs: [
    'What runs today: routing, streaming, per-agent budgets and timeouts, session memory that resumes, MCP tools for files and tasks, and the automatic handoffs. The team behavior is real, end to end.',
    'The edges are drawn on purpose. The sandbox runs commands in plain local folders rather than isolated containers, channel routing picks the first matching agent instead of arbitrating, and there are no tests yet. It demonstrates the idea cleanly; the hardening is the next layer.',
  ],
}

export const SECTIONS = [
  { id: 'what', label: 'The idea' },
  { id: 'crew', label: 'The crew' },
  { id: 'routing', label: 'Routing' },
  { id: 'credit', label: 'Built with' },
  { id: 'close', label: 'What runs' },
]
