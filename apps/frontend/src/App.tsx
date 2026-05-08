import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">AI Chat Frontend</h1>
          <p className="text-sm text-muted-foreground">
            Frontend placeholder for the Vite React app.
          </p>
        </div>
        <Button type="button">shadcn/ui Button</Button>
      </section>
    </main>
  );
}
