"use client";

import { useAuth } from "@/components/auth-provider";
import { TylerStatus } from "@/components/tyler-status";
import { WorkoutLogger } from "@/components/workout-logger";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [cityName, setCityName] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
            return;
        }
        if (user) {
            const fetchProfile = async () => {
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists() && snap.data().cityName) {
                    setCityName(snap.data().cityName);
                } else {
                    // No city ? Redirect join
                    router.push("/join");
                }
            };
            fetchProfile();
        }
    }, [user, loading, router]);

    if (loading || !cityName) {
        return <div className="p-8 text-xs font-mono animate-pulse">AUTHENTICATING IDENTITY...</div>;
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">{cityName}</h1>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Subject Active</div>
                </div>
                <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                    <Link href="/leaderboard" className="hover:text-white text-zinc-500 transition-colors">Rankings</Link>
                    <Link href="/settings" className="hover:text-red-500 text-zinc-500 transition-colors">Purge</Link>
                </nav>
            </header>

            <TylerStatus />

            <WorkoutLogger cityName={cityName} />

            {/* Basic History Feed could go here */}
            <div className="pt-8">
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Recent Activity</h3>
                <div className="text-xs text-zinc-500 font-mono">
                    {/* Real implementation would map over 'workouts' collection */}
                    <p>LOGS ARE ARCHIVED.</p>
                </div>
            </div>
        </div>
    );
}
