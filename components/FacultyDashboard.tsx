"use client";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FacultyDashboard({ user, profile }: { user: any, profile: any }) {
  const router = useRouter();
  const name = profile?.name || "Faculty Member";
  const dept = profile?.department || "General Dept";

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800">Faculty Portal</h1>
          <p className="text-xs text-slate-400 uppercase mt-1">GPTC Pala</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem active icon="🏠" label="Dashboard" onClick={() => {}} />
          <SidebarItem icon="📅" label="Mark Attendance" onClick={() => router.push('/dashboard/attendance')} />
          <SidebarItem icon="📝" label="My Subjects" onClick={() => {}} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 hover:bg-red-50 w-full p-3 rounded-lg transition font-bold text-sm">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Hello, {name} 👋</h2>
            <p className="text-sm text-slate-500">{dept}</p>
          </div>
          <button onClick={() => signOut(auth)} className="md:hidden text-sm font-bold text-red-500">Logout</button>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {/* Hero Action Card */}
          <div className="bg-gradient-to-r from-blue-700 to-[#1A3B8C] rounded-2xl p-10 text-white shadow-xl mb-10 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">Ready to take attendance?</h3>
              <p className="text-blue-100 max-w-lg">Select your batch and subject to quickly mark hourly attendance for your students.</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/attendance')}
              className="mt-6 md:mt-0 bg-white text-blue-800 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition transform hover:scale-105"
            >
              Start Session ➜
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-700 mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickLink icon="📅" title="Attendance History" desc="View past logs" />
            <QuickLink icon="📄" title="Subject Report" desc="Download PDF" />
            <QuickLink icon="⚙️" title="Profile Settings" desc="Update info" />
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, onClick, active }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition font-medium ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
      <span className="text-xl">{icon}</span> <span>{label}</span>
    </button>
  );
}

function QuickLink({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="font-bold text-slate-800">{title}</h4>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}