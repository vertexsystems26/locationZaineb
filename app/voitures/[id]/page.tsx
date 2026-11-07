import type { Metadata } from "next";
import { CarDetailView } from "@/components/cars/car-detail-view";

export const metadata: Metadata = { title: "Détail voiture" };

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CarDetailView id={id} />;
}
