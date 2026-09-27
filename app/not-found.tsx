import Link from 'next/link'

export const metadata = { title: 'Not found' }

export default function NotFound() {
  return (
    <div className="p-body">
      <h2 className="p-title">Nothing here.</h2>
      <p className="p-text">
        That page doesn’t exist, or it moved in the redesign. <Link href="/">Back to the work</Link>
        .
      </p>
    </div>
  )
}
