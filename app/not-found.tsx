import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#14110e] px-6 text-[#f4ece3]">
      <div>
        <p className="text-xs tracking-[0.28em] text-[#d4a574] uppercase">404</p>
        <h1 className="mt-3 font-serif text-4xl">This page is not on the public site.</h1>
        <p className="mt-3 text-[#b9a89a]">
          <Link href="/" className="underline">
            Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
