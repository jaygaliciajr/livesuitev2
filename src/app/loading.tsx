import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
        <Skeleton className="h-30" />
      </div>
      <Skeleton className="h-44" />
      <Skeleton className="h-44" />
    </div>
  );
}
