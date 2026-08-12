import KanbanView from "@/components/KanbanView";
import ListShell from "@/components/ListShell";

export default function BoardPage() {
  return (
    <ListShell title="Funnel Board">
      <KanbanView />
    </ListShell>
  );
}
