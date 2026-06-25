import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn()", () => {
  it("merges two class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles conditional classes with falsy values", () => {
    expect(cn("base", false && "hidden", undefined, null, "active")).toBe(
      "base active",
    )
  })

  it("handles object syntax from clsx", () => {
    expect(cn({ "text-red-500": true, "text-green-500": false })).toBe(
      "text-red-500",
    )
  })

  it("handles array syntax from clsx", () => {
    expect(cn(["flex", "items-center"])).toBe("flex items-center")
  })

  it("returns empty string when no classes are passed", () => {
    expect(cn()).toBe("")
  })

  it("merges bg color conflicts — last wins", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
  })

  it("handles nested arrays and objects", () => {
    expect(cn(["p-4", { "rounded-md": true, "rounded-none": false }])).toBe(
      "p-4 rounded-md",
    )
  })
})
