"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";

export default function JoinPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [city, setCity] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city.trim()) return;
        if (!user) return;

        setSubmitting(true);
        setError("");

        const cityName = city.trim();
        // Normalize for ID uniqueness: UPPERCASE, no spaces (or replace with -)?
        // User wants "Berlin". "New York".
        // Let's us UPPERCASE for uniqueness check.
        const cityId = cityName.toUpperCase().replace(/\s+/g, "_");

        try {
            await runTransaction(db, async (transaction) => {
                const cityRef = doc(db, "cities", cityId);
                const userRef = doc(db, "users", user.uid);

                const cityDoc = await transaction.get(cityRef);
                if (cityDoc.exists()) {
                    throw new Error("City already claimed.");
                }

                const userDoc = await transaction.get(userRef);
                if (userDoc.exists() && userDoc.data().cityName) {
                    throw new Error("You already have a city.");
                }

                transaction.set(cityRef, {
                    uid: user.uid,
                    displayName: cityName,
                    createdAt: serverTimestamp(),
                });

                transaction.set(userRef, {
                    cityName: cityName,
                    cityId: cityId,
                    joinedAt: serverTimestamp(),
                    points: 0
                }, { merge: true });
            });

            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to claim city.");
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold uppercase tracking-widest">
                    Choose Your Identity
                </h1>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    One city. One life. Irreversible.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="space-y-2">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="ENTER CITY NAME"
                        className="brutal-input text-center text-xl uppercase font-bold text-white placeholder:text-zinc-700"
                        autoFocus
                        maxLength={30}
                    />
                    {error && <p className="text-destructive text-xs uppercase text-center font-bold animate-pulse">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={submitting || !city}
                    className="w-full bg-white text-black font-bold uppercase py-4 tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? "Claiming..." : "Claim City"}
                </button>
            </form>

            <div className="text-[10px] text-zinc-600 font-mono text-center max-w-xs">
                WARNING: This cannot be changed. If you delete your account, this city name is burned forever.
            </div>
        </div>
    );
}
