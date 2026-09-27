'use client'

import { useEffect, useRef } from 'react'
import { PALETTES, buildLUT } from '@/lib/wall'

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)
const PX = 2

/**
 * My photo printed in the same four-ink dither as the background, in the
 * About palette. Hover or focus shows the photo itself.
 */
export function DitherPhoto({ src, alt }: { src: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const img = new Image()
    let drawnW = 0
    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!img.complete || !img.naturalWidth || !w || !h || w === drawnW) return
      drawnW = w
      const bw = Math.ceil(w / PX)
      const bh = Math.ceil(h / PX)
      const off = document.createElement('canvas')
      off.width = bw
      off.height = bh
      const octx = off.getContext('2d')!
      // Cover-crop the square source to the frame, a little above centre.
      const s = Math.max(bw / img.width, bh / img.height)
      const dw = img.width * s
      const dh = img.height * s
      octx.drawImage(img, (bw - dw) / 2, (bh - dh) * 0.35, dw, dh)
      const data = octx.getImageData(0, 0, bw, bh)
      const lut = buildLUT(PALETTES.about)
      const inks = [0.02, 0.3, 0.62, 0.95].map((v) => {
        const k = Math.round(v * 255) * 3
        return [lut[k], lut[k + 1], lut[k + 2]]
      })
      for (let j = 0; j < bh; j++)
        for (let i = 0; i < bw; i++) {
          const o = (j * bw + i) * 4
          const lum =
            (0.2126 * data.data[o] + 0.7152 * data.data[o + 1] + 0.0722 * data.data[o + 2]) / 255
          const v = Math.min(1, Math.max(0, (lum - 0.08) * 1.25))
          const q = Math.min(3, (v * 3 + B4[(j & 3) * 4 + (i & 3)]) | 0)
          const [r, g, b] = inks[q]
          data.data[o] = r
          data.data[o + 1] = g
          data.data[o + 2] = b
          data.data[o + 3] = 255
        }
      octx.putImageData(data, 0, 0)
      canvas.width = bw * PX
      canvas.height = bh * PX
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, bw * PX, bh * PX)
    }
    img.onload = draw
    img.src = src
    // The pane may still be laying out when the image arrives.
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [src])

  return (
    <figure className="portrait" tabIndex={0}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <canvas ref={canvasRef} aria-hidden="true" />
    </figure>
  )
}
