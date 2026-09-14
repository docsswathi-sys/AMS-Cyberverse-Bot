import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import TopBar from "./topbar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050914] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="min-w-0 flex-1">
            <div className="min-h-full p-5 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}