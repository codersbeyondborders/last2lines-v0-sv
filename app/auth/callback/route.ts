import { createClient } from '@/lib/supabase/server'

// Fluid Compute: quick Supabase token exchange.
export const maxDuration = 10
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }
  }

  const errorResponse = NextResponse.redirect(`${origin}/auth/error`)
  errorResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
  errorResponse.headers.set("Pragma", "no-cache")
  return errorResponse
}
