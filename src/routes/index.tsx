import { createFileRoute } from "@tanstack/react-router";
import { ChecklistApp } from "@/components/checklist-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <ChecklistApp />;
}
