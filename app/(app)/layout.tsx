import AppHeader from "@/components/AppHeader";
import AssistantChat from "@/components/AssistantChat";
import { StoreProvider } from "@/lib/client-state";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex h-screen min-w-[1100px] flex-col">
        <AppHeader />
        {children}
        <AssistantChat />
      </div>
    </StoreProvider>
  );
}
