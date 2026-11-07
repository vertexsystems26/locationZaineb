import type { Metadata } from "next";
import { RentalsView } from "@/components/rentals/rentals-view";

export const metadata: Metadata = { title: "Locations" };

export default function RentalsPage() {
  return <RentalsView />;
}
