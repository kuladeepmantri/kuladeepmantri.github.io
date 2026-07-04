// Single source for the deid page. Short and plain. Honest about what is
// wired versus scaffolded. Facts verified against the repo.

export const HERO = {
  eyebrow: 'deid · KM-2023-0001 · PII masking service',
  headline: 'Scrubbing personal data out of text',
  sub: 'DeID-Anonymizer detects sensitive data in text and masks it, behind a FastAPI service with a job queue, object storage, and a React UI. The detection runs inline; the async pipeline is built out and ready to carry it.',
  meta: ['FastAPI · Celery', 'React · Vite', 'regex detection', 'PII masking'],
}

export const BODY = {
  paragraphs: [
    'The shape is a de-identification platform: point it at text, and it detects personal data and masks it by policy, with an API, background jobs, and object storage behind it.',
    'What runs today is deliberately narrow. Detection is regex, email and phone, masking what it matches, inline in the endpoint. The FastAPI service, the Celery queue, and the MinIO storage are wired as scaffolding for the next layer: spaCy and Presidio doing real named-entity recognition, and files moving through the queue instead of the request. The frame is built; the detector is the part that grows.',
  ],
}

// The architecture, drawn as intended vs what is wired.
export const ARCH = [
  { key: 'api', label: 'FastAPI', sub: '/deid/text', wired: true },
  { key: 'queue', label: 'Celery + Redis', sub: 'async jobs', wired: false },
  { key: 'store', label: 'MinIO', sub: 'object storage', wired: false },
]

export const CLOSE =
  'It is where I started building services, and the bones are the same ones I still reach for: a typed API, a queue, object storage, a small React front. The detector is regex today, and the platform around it is ready for the model that replaces it.'

export const SECTIONS = [
  { id: 'what', label: 'What it is' },
  { id: 'arch', label: 'The pipeline' },
  { id: 'close', label: 'The bones' },
]
