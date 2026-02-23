import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center px-6 max-w-md">
        <div className="text-6xl mb-4">🚗</div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
        <h2 className="text-xl text-zinc-600 mb-6">
          This page took a wrong turn
        </h2>
        <p className="text-zinc-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
          >
            Analyze a Vehicle
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-colors font-medium"
          >
            Read the Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
