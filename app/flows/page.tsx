import { FlowDiagrams } from "@/components/flow-diagrams"

export const metadata = {
  title: "Flow Diagrams — Last2Lines",
  description: "System and user flow diagrams for the Last2Lines platform.",
}

export default function FlowsPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-2">
            Architecture
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground text-balance mb-3">
            Flow Diagrams
          </h1>
          <p className="text-muted-foreground text-lg text-pretty max-w-2xl">
            User journeys, system pipelines, and admin workflows for the Last2Lines platform.
          </p>
        </header>

        <FlowDiagrams />
      </div>
    </main>
  )
}
