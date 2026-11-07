import SettingsClient from "@/components/SettingsClient";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Settings" };
export default async function Page() {
  const { org, isAdmin } = await getAppContext();
  return <div className="space-y-4"><h1 className="font-display text-3xl font-extrabold">Settings</h1><SettingsClient org={org} isAdmin={isAdmin} /></div>;
}
