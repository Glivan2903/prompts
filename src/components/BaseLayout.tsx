import { Sidebar } from "@/components/Sidebar";

interface BaseLayoutProps {
  children: React.ReactNode;
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto border-t border-border">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 