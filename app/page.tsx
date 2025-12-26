"use client";

import { useEffect, useState } from "react";
// FIX: Use single dot (..) because we are in the main app folder
import { auth, db } from "../lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

// FIX: Use single dot (..) to find components
import StudentDashboard from "../components/StudentDashboard";
import FacultyDashboard from "../components/FacultyDashboard";

export default function Home() {
  // ... Keep the rest of your code exactly the same ...
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists()) {
           setProfile(docSnap.data());
           setRole(docSnap.data().role || "student");
        } else {
           setRole("admin");
        }
      } catch (e) { console.error(e); }
    });
    return () => unsubscribe();
  }, [router]);

  // ... (Keep the rest of your return logic) ...
  
  if (role === "loading") return <div className="p-10 text-center">Loading...</div>;
  if (role === "student") return <StudentDashboard user={user} profile={profile} />;
  if (['faculty', 'hod', 'tutor'].includes(role)) return <FacultyDashboard user={user} profile={profile} />;

  // Admin View
  return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
            <h1 className="text-xl font-bold">GPTC Pala</h1>
            <button onClick={() => signOut(auth)} className="bg-red-500 px-4 py-2 rounded">Logout</button>
        </nav>
        <div className="p-10 text-center">
            <h2 className="text-2xl font-bold">Welcome Admin</h2>
            <p>Go to <button onClick={() => router.push('/dashboard')} className="text-blue-600 underline">Dashboard</button></p>
        </div>
      </div>
  );
}