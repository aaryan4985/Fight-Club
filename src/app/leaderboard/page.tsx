"use client";

import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RankUser {
    id: string;
    cityName: string;
    points: number;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<RankUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "users"),
            orderBy("points", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                cityName: d.data().cityName || "Unknown",
                points: d.data().points || 0
            }));
            setUsers(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <h1 className="text-2xl font-black uppercase tracking-widest">Global Hierarchy</h1>
                <Link href="/dashboard" className="text-xs font-bold uppercase hover:underline">Back</Link>
            </header>

            {loading ? (
                <div className="text-xs font-mono animate-pulse">CALCULATING STANDING...</div>
            ) : (
                <div className="space-y-2">
                    {users.map((u, i) => (
                        <div key={u.id} className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-900 border-l-2 border-l-zinc-700">
                            <div className="flex items-baseline gap-4">
                                <span className="text-xl font-black text-zinc-600 w-8">#{i + 1}</span>
                                <span className="text-lg font-bold uppercase tracking-widest text-white">{u.cityName}</span>
                            </div>
                            <div className="font-mono text-zinc-400 text-sm">
                                {u.points} PTS
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
