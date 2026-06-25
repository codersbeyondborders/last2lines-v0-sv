import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ---------------------------------------------------------------------------
// Mock @vercel/blob
// ---------------------------------------------------------------------------
const mockPut = vi.fn()
vi.mock("@vercel/blob", () => ({
  put: mockPut,
}))

const { POST } = await import("@/app/api/upload/route")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeUploadRequest(file: File | null): NextRequest {
  const formData = new FormData()
  if (file) formData.set("file", file)

  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  })
}

function makeFile(
  name: string,
  type: string,
  content = "fake-image-data",
): File {
  return new File([content], name, { type })
}

describe("POST /api/upload", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when no file is provided in formData", async () => {
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: new FormData(),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/no file/i)
  })

  it("returns 400 for unsupported file types (gif)", async () => {
    const file = makeFile("animation.gif", "image/gif")
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/only png and jpg/i)
  })

  it("returns 400 for unsupported file types (webp)", async () => {
    const file = makeFile("photo.webp", "image/webp")
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/only png and jpg/i)
  })

  it("uploads a PNG file and returns the blob URL", async () => {
    mockPut.mockResolvedValueOnce({ url: "https://blob.vercel.com/photo.png" })
    const file = makeFile("photo.png", "image/png")
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("https://blob.vercel.com/photo.png")
  })

  it("uploads a JPEG file and returns the blob URL", async () => {
    mockPut.mockResolvedValueOnce({ url: "https://blob.vercel.com/photo.jpg" })
    const file = makeFile("photo.jpg", "image/jpeg")
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe("https://blob.vercel.com/photo.jpg")
  })

  it("calls put() with public access and addRandomSuffix", async () => {
    mockPut.mockResolvedValueOnce({ url: "https://blob.vercel.com/img.png" })
    const file = makeFile("img.png", "image/png")
    await POST(makeUploadRequest(file))
    expect(mockPut).toHaveBeenCalledWith(
      "img.png",
      expect.any(Buffer),
      expect.objectContaining({ access: "public", addRandomSuffix: true }),
    )
  })

  it("returns 500 when Vercel Blob put() throws", async () => {
    mockPut.mockRejectedValueOnce(new Error("Blob storage unavailable"))
    const file = makeFile("photo.png", "image/png")
    const res = await POST(makeUploadRequest(file))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/upload failed/i)
  })

  it("sets Cache-Control: no-store on all responses", async () => {
    mockPut.mockResolvedValueOnce({ url: "https://blob.vercel.com/photo.png" })
    const file = makeFile("photo.png", "image/png")
    const res = await POST(makeUploadRequest(file))
    expect(res.headers.get("Cache-Control")).toContain("no-store")
  })
})
