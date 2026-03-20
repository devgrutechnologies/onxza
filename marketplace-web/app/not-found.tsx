import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-gray-400">
        This page doesn&apos;t exist in the marketplace.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-onxza-blue px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-onxza-blue/80"
      >
        Back to Home
      </Link>
    </div>
  );
}
