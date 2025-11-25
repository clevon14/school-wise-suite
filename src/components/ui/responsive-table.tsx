import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ResponsiveTable({ children, className, ...props }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full overflow-x-auto -mx-3 md:mx-0", className)} {...props}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden md:rounded-lg">
          <Table>
            {children}
          </Table>
        </div>
      </div>
    </div>
  );
}
