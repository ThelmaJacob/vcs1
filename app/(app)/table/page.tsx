import BackButton from "@/components/BackButton";
import ListShell from "@/components/ListShell";
import TableView from "@/components/TableView";

export default function TablePage() {
  return (
    <div className="space-y-4">
      <BackButton />
      <ListShell title="Table View">
        <TableView />
      </ListShell>
    </div>
  );
}
