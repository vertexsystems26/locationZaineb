import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="Page introuvable"
      description="Cette adresse n'existe pas ou a été déplacée."
      action={
        <Button asChild>
          <Link href="/">Retour au tableau de bord</Link>
        </Button>
      }
    />
  );
}
