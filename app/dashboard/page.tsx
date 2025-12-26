"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// --- IMPORT THE 3 DASHBOARD COMPONENTS ---
// Make sure these files exist in 'src/components/' !
import AdminDashboard from "@/components/AdminDashboard";
import FacultyDashboard from "@/components/FacultyDashboard";
import StudentDashboard from "@/components/StudentDashboard";

export default function DashboardPage() { // <--- This 'export default' is what Next.js looks for!
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/"); // Redirect to login if not signed in
        return;
      }
      setUser(currentUser);

      try {
        // 1. FAST CHECK: Custom Claims (if set via API)
        const idTokenResult = await currentUser.getIdTokenResult();
        
        if (idTokenResult.claims.role) {
           const claimRole = idTokenResult.claims.role as string;
           setRole(claimRole);
           await fetchProfileData(currentUser.uid, claimRole);
        } else {
           // 2. SLOW CHECK: Database Fallback (if API wasn't used)
           await determineRoleFromDB(currentUser.uid);
        }

      } catch (error) {
        console.error("Role check failed:", error);
        setRole("error");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper: Fetch Name/Dept info
  const fetchProfileData = async (uid: string, userRole: string) => {
    let collectionName = "users"; // Default for admins
    if (userRole === "student") collectionName = "students";
    if (userRole === "faculty") collectionName = "faculty";

    const docSnap = await getDoc(doc(db, collectionName, uid));
    if (docSnap.exists()) {
      setProfile(docSnap.data());
    }
  };

  // Helper: Find user if Custom Claim is missing
  const determineRoleFromDB = async (uid: string) => {
    // A. Check Student
    const studentSnap = await getDoc(doc(db, "students", uid));
    if (studentSnap.exists()) {
      setRole("student");
      setProfile(studentSnap.data());
      return;
    }

    // B. Check Faculty
    const facultySnap = await getDoc(doc(db, "faculty", uid)); 
    if (facultySnap.exists()) {
      setRole("faculty");
      setProfile(facultySnap.data());
      return;
    }

    // C. Check Admin
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists() && userSnap.data().role === 'admin') {
      setRole("admin");
      setProfile(userSnap.data());
      return;
    }

    // D. Unknown User
    setRole("unauthorized");
  };

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- TRAFFIC CONTROLLER ---
  if (role === "student") return <StudentDashboard user={user} profile={profile} />;
  if (role === "faculty") return <FacultyDashboard user={user} profile={profile} />;
  if (role === "admin") return <AdminDashboard />;
  
  // --- ERROR STATE ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md border border-red-100">
        <div className="text-4xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-slate-500 mb-6 text-sm">
          Your account ({user?.email}) does not have an assigned role. 
          <br/>Please ask the Administrator to verify your account.
        </p>
        <button onClick={() => auth.signOut()} className="bg-slate-800 hover:bg-black text-white px-6 py-2 rounded-lg font-bold transition">
          Sign Out
        </button>
      </div>
    </div>
  );
}