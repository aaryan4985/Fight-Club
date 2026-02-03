"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Check if user has a city
      const checkCity = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().cityName) {
          router.push("/dashboard");
        } else {
          router.push("/join");
        }
      };
      checkCity();
    }
  }, [user, router]);

  const handleEnter = async () => {
    await signIn();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white font-mono uppercase tracking-widest animate-pulse">
        Initializing...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tighter uppercase glitch-text">
          Fight Club
        </h1>
        <p className="text-muted-foreground uppercase tracking-[0.2em] text-sm">
          Anonymous. Brutal. Tracking.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-8">
        <div className="border border-zinc-800 p-6 space-y-4 text-left text-sm font-mono text-zinc-400">
          <p>Rule 1: No names.</p>
          <p>Rule 2: You are your city.</p>
          <p>Rule 3: Tyler judges everything.</p>
        </div>

        <button
          onClick={handleEnter}
          className="w-full bg-white text-black font-bold uppercase py-4 tracking-widest hover:bg-zinc-200 transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
