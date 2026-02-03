"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export function TylerStatus() {
    const { user } = useAuth();
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "messages"),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setMessage(snapshot.docs[0].data().content);
            } else {
                setMessage("Waiting for data.");
            }
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="w-full border-l-2 border-white pl-4 py-2 my-8">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                System Status
            </div>
            <div className="text-xl font-bold font-mono min-h-[1.5em] text-white glitch-text">
                {message ? `"${message}"` : <span className="animate-pulse">...</span>}
            </div>
        </div>
    );
}
