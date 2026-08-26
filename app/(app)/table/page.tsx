import BackButton from "@/components/BackButton";
import ExportCsvButton from "@/components/ExportCsvButton";
import ListShell from "@/components/ListShell";
import TableView from "@/components/TableView";

export default function TablePage() {
  return (
    <ListShell
      title="Table View"
      leading={
        <>
          <BackButton />
          <ExportCsvButton />
        </>
      }
    >
      <TableView />
    </ListShell>
  );
}
