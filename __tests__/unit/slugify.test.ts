import { describe, it, expect } from "vitest"
import { slugify } from "@/lib/utils"

describe("slugify()", () => {
  it("lowercases the input", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("clean rivers now")).toBe("clean-rivers-now")
  })

  it("replaces special characters with hyphens", () => {
    expect(slugify("Save the Ocean! #2024")).toBe("save-the-ocean-2024")
  })

  it("collapses consecutive non-alphanumeric chars into a single hyphen", () => {
    expect(slugify("forests & rivers -- now!")).toBe("forests-rivers-now")
  })

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  --hello--  ")).toBe("hello")
  })

  it("trims whitespace before converting", () => {
    expect(slugify("   earth day   ")).toBe("earth-day")
  })

  it("returns 'campaign' for empty string", () => {
    expect(slugify("")).toBe("campaign")
  })

  it("returns 'campaign' for a string of only special characters", () => {
    expect(slugify("!!!---???")).toBe("campaign")
  })

  it("truncates to 60 characters", () => {
    const long = "a".repeat(80)
    expect(slugify(long).length).toBeLessThanOrEqual(60)
  })

  it("handles unicode/emoji by stripping them", () => {
    expect(slugify("save 🌍 earth")).toBe("save-earth")
  })

  it("handles numbers correctly", () => {
    expect(slugify("campaign 2024")).toBe("campaign-2024")
  })

  it("handles already-valid slug input", () => {
    expect(slugify("clean-energy")).toBe("clean-energy")
  })
})
