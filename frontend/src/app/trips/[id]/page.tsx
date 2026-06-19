import { TripPlanner } from "@/components/trip-planner";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-gray-100">
      <TripPlanner initialTripId={id} />
    </main>
  );
}
