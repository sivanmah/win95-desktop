import { headers } from "next/headers";
import Desktop from "@/app/components/Desktop";

export default async function Page() {
  const headersList = await headers();
  const displayName = headersList.get("display-name") || "Anonymous";

  return <Desktop displayName={displayName} />;
}
