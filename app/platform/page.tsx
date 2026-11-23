import { PlatformAdmin } from "@/components/platform-admin";
import { cloudMode } from "@/lib/config";
import { notFound } from "next/navigation";
export default function PlatformPage() {
  if (!cloudMode) notFound();
  return <main id="main-content"><PlatformAdmin /></main>;
}
