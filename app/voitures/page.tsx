import type { Metadata } from "next";
import { CarsView } from "@/components/cars/cars-view";

export const metadata: Metadata = { title: "Voitures" };

export default function CarsPage() {
  return <CarsView />;
}
