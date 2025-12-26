"use client";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, faculty: 0, batches: 0, depts: 0 });
  
  // FETCH STATS
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [s, f, b, d] = await Promise.all([
          getDocs(collection(db, "students")),
          getDocs(collection(db, "faculty")),
          getDocs(collection(db, "batches")),
          getDocs(collection(db, "departments"))
        ]);
        setStats({ students: s.size, faculty: f.size, batches: b.size, depts: d.size });
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#1A3B8C] text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-blue-800">
          <h1 className="text-2xl font-bold tracking-tight">GPTC Admin</h1>
          <p className="text-xs text-blue-300 uppercase mt-1 tracking-widest">Control Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-blue-400 uppercase px-3 mb-2 mt-2">People</p>
          <SidebarItem icon="👨‍🎓" label="Students" onClick={() => router.push('/dashboard/students')} />
          <SidebarItem icon="👔" label="Faculty" onClick={() => router.push('/dashboard/faculty')} />
          
          <p className="text-xs font-bold text-blue-400 uppercase px-3 mb-2 mt-6">Academics</p>
          <SidebarItem icon="🏛️" label="Departments" onClick={() => router.push('/dashboard/departments')} />
          <SidebarItem icon="📚" label="Classes / Batches" onClick={() => router.push('/dashboard/batches')} />
          <SidebarItem icon="📖" label="Subjects" onClick={() => router.push('/dashboard/subjects')} />

          <p className="text-xs font-bold text-blue-400 uppercase px-3 mb-2 mt-6">Reports</p>
          <SidebarItem icon="📊" label="Attendance Logs" onClick={() => router.push('/dashboard/attendance')} />
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-200 hover:text-white transition w-full p-3 rounded-lg hover:bg-white/10">
            <span>🚪</span> <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-8">
          <h2 className="text-3xl font-bold text-slate-800">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Welcome back, Administrator.</p>
        </header>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Students" value={stats.students} icon="👨‍🎓" color="bg-blue-50 text-blue-600" />
            <StatCard title="Total Faculty" value={stats.faculty} icon="👔" color="bg-purple-50 text-purple-600" />
            <StatCard title="Active Classes" value={stats.batches} icon="📚" color="bg-orange-50 text-orange-600" />
            <StatCard title="Departments" value={stats.depts} icon="🏛️" color="bg-green-50 text-green-600" />
          </div>

          {/* Quick Actions */}
          <h3 className="text-lg font-bold text-slate-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActionCard title="Add New Student" desc="Register a new admission" icon="+" onClick={() => router.push('/dashboard/students')} />
            <ActionCard title="Create Class" desc="Start a new academic batch" icon="+" onClick={() => router.push('/dashboard/batches')} />
            <ActionCard title="Approve Faculty" desc="Manage staff access" icon="+" onClick={() => router.push('/dashboard/faculty')} />
          </div>
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---
function SidebarItem({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 text-left transition text-blue-50 font-medium">
      <span className="text-xl">{icon}</span> <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase">{title}</p>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition text-left group">
      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">{icon}</div>
      <h4 className="font-bold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-400">{desc}</p>
    </button>
  );
}