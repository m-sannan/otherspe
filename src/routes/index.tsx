import { createFileRoute } from "@tanstack/react-router";
import { OthersPeApp } from "@/components/otherspe-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OthersPeApp />;
}
