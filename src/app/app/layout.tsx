import Link from "next/link";
import { getAppContext } from "@/lib/app-context";
import { Nav } from "@/components/Nav";
import { Logo } from "@/components/Logo";


export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await getAppContext({ allowNoOrg: true });
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-line bg-forest2 text-cream lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/app"><Logo light /></Link>
        </div>
        {org && <p className="px-5 pb-2 text-xs uppercase tracking-wide opacity-60">{org.name}</p>}
        <Nav email={user.email ?? ""} />
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
