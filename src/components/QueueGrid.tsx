import type { DetailAntrian } from "@/types";
import QueueCard from "./QueueCard";

export default function QueueGrid({ data }: { data: DetailAntrian[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((item) => (
        <QueueCard key={item.unit_id} antrian={item} />
      ))}
    </div>
  );
}