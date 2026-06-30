import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r min-h-screen p-6">
      <h2 className="text-xl font-bold mb-6">
        Wealth Tracker
      </h2>

      <nav className="space-y-3">

        <Link href="/dashboard"
        className="block hover:text-blue-600">
          Dashboard
        </Link>

        <Link href="/accounts"
        className="block hover:text-blue-600">
          Accounts
        </Link>

        <Link href="/assets"
        className="block hover:text-blue-600">
          Assets
        </Link>

        <Link href="/investments"
        className="block hover:text-blue-600">
          Investments
        </Link>

        <Link href="/reports"
        className="block hover:text-blue-600">
          Reports
        </Link>

        <Link href="/settings"
        className="block hover:text-blue-600">
          Settings
        </Link>

      </nav>
    </aside>
  );
}