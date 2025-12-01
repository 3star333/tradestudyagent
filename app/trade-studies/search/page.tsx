import { Input } from "@/components/ui/input";

export default function SearchTradeStudiesPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold">Search trade studies</h1>
      <p className="text-muted-foreground">Stub endpoint for future filtering and retrieval.</p>
      <div className="mt-6">
        <Input placeholder="Search by title or requirement" />
      </div>
    </div>
  );
}
