import { redirect } from "next/navigation";
import { DEFAULT_MINDMAP_ID } from "@/lib/api";

export default function CanvasIndexPage() {
  redirect(`/canvas/${DEFAULT_MINDMAP_ID}`);
}
