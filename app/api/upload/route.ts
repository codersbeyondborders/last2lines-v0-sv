import { put } from '@vercel/blob'

// Fluid Compute: allow up to 30 s for large file uploads to Vercel Blob.
export const maxDuration = 30
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      const response = NextResponse.json({ error: 'No file provided' }, { status: 400 })
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      const response = NextResponse.json(
        { error: 'Only PNG and JPG files are allowed' },
        { status: 400 }
      )
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }

    // Convert File to ArrayBuffer then Buffer for Vercel Blob
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to public Blob storage with random suffix to avoid conflicts
    const blob = await put(file.name, buffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: true,
    })

    const response = NextResponse.json({ url: blob.url })
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    return response
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const response = NextResponse.json(
      { error: `Upload failed: ${errorMessage}` },
      { status: 500 }
    )
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    return response
  }
}
