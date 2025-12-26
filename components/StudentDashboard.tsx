"use client";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function StudentDashboard({ user, profile }: { user: any, profile: any }) {
  const router = useRouter();
  const [attendance, setAttendance] = useState(78); // Mock data for demo
  const name = profile?.name || "Student";
  const batch = profile?.batchName || "Batch Info";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0">
      
      {/* --- HEADER --- */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
               {name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">{name}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="text-sm font-bold text-slate-400 hover:text-red-500">Logout</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        
        {/* --- ATTENDANCE CARD --- */}
        <div className="bg-[#1A3B8C] rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
           
           <div className="relative z-10">
             <div className="flex justify-between items-end mb-4">
               <div>
                 <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Overall Attendance</p>
                 <h2 className="text-5xl font-black">{attendance}%</h2>
               </div>
               <div className="text-right">
                 <p className="text-xs font-medium opacity-80">Target: 75%</p>
               </div>
             </div>

             {/* Bar */}
             <div className="w-full bg-black/20 rounded-full h-3 mb-4">
               <div className="h-3 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${attendance}%` }}></div>
             </div>
             
             <p className="text-sm font-medium text-blue-100 flex items-center gap-2">
               {attendance >= 75 ? "✅ You are safe for exams." : "⚠️ Warning: Low attendance."}
             </p>
           </div>
        </div>

        {/* --- MENU GRID --- */}
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Academics</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
           <MenuBtn icon="📊" title="My Log" desc="Daily History" />
           <MenuBtn icon="📝" title="Subjects" desc="Curriculum" />
           <MenuBtn icon="📢" title="Notices" desc="College News" />
           <MenuBtn icon="💼" title="Placements" desc="Job Drives" />
        </div>

      </div>

      {/* --- MOBILE BOTTOM NAV (For Students) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center z-50">
        <NavIcon icon="🏠" label="Home" active />
        <NavIcon icon="📊" label="Attend" />
        <NavIcon icon="👤" label="Profile" />
      </div>
    </div>
  );
}

function MenuBtn({ icon, title, desc }: any) {
  return (
    <button className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left active:scale-95 transition">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <p className="text-[10px] text-slate-400">{desc}</p>
    </button>
  );
}

function NavIcon({ icon, label, active }: any) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? 'text-blue-700' : 'text-slate-400'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}