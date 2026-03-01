import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-3 pb-28 pt-4 sm:px-4">
      {children}
      <BottomNav />
    </div>
  );
}
