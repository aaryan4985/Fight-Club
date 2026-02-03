"use client";

import { useAuth } from "@/components/auth-provider";
import { deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!user) return;
        setDeleting(true);
        try {
            // Mark user doc as inactive/deleted but keep city Name locked logic?
            // The city doc remains to lock the name.
            // We should flag the user record just in case.
            await updateDoc(doc(db, "users", user.uid), {
                status: "DELETED",
                deletedAt: new Date()
            });

            await deleteUser(user);
            router.push("/");
        } catch (e: any) {
            alert("Error deleting: " + e.message); // Minimal error handling
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            <header className="pb-4 border-b border-zinc-800">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-red-700">Danger Zone</h1>
                    <Link href="/dashboard" className="text-xs font-bold uppercase hover:underline">Cancel</Link>
                </div>
            </header>

            <div className="brutal-card border-red-900/50 bg-red-950/10 space-y-4">
                <h2 className="text-lg font-bold uppercase text-red-500">Self Destruction</h2>
                <p className="text-zinc-400 text-sm">
                    Deleting your account is permanent.
                    <br />
                    Your City Name ("{user && "..."}") will be <span className="text-white font-bold">PERMANENTLY RETIRED</span>.
                    <br />
                    It can never be claimed again.
                </p>

                {!confirming ? (
                    <button
                        onClick={() => setConfirming(true)}
                        className="w-full border border-red-700 text-red-700 p-4 font-bold uppercase hover:bg-red-900/20 transition-colors"
                    >
                        Delete User
                    </button>
                ) : (
                    <div className="space-y-2">
                        <p className="text-red-500 font-bold uppercase text-center animate-pulse">Are you sure?</p>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full bg-red-700 text-white p-4 font-bold uppercase hover:bg-red-800 transition-colors"
                        >
                            {deleting ? "ERASING..." : "CONFIRM DELETION"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
