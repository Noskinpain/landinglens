"use client";

import { useRouter } from "next/navigation";

export default function ThankYou() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f5f0eb] text-[#1a1a1a] flex flex-col items-center justify-center font-sans px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🔥</div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Payment confirmed!
        </h1>
        <p className="text-[#1a1a1a]/50 text-base leading-relaxed mb-8">
          Your full audit report is ready to download. Head back to your results
          page to grab it.
        </p>
        <button
          onClick={() => router.back()}
          className="bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
        >
          ← Back to my report
        </button>
      </div>
    </main>
  );
}
