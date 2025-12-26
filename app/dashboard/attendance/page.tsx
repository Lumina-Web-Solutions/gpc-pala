"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function MarkAttendance() {
  const router = useRouter();
  
  // Data States
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Track loading state
  
  // Selection States
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedHour, setSelectedHour] = useState("1");

  // 1. Fetch Batches (With Debugging)
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        console.log("📡 Fetching Batches...");
        const snap = await getDocs(collection(db, "batches"));
        
        if (snap.empty) {
          console.warn("⚠️ No batches found in 'batches' collection!");
          setBatches([]);
        } else {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log("✅ Batches Loaded:", list);
          setBatches(list);
        }
      } catch (e) { 
        console.error("❌ Error fetching batches:", e); 
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };
    fetchBatches();
  }, []);

  // 2. Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const snap = await getDocs(collection(db, "subjects"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSubjects(list);
      } catch (e) { console.error("Error fetching subjects:", e); }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50 flex items-center gap-3 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
        >
          <span>⬅</span> Back
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">Attendance</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Faculty Console</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow p-4 md:p-6 max-w-4xl mx-auto w-full">
        
        {/* Date Display */}
        <div className="flex justify-end mb-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 shadow-sm">
            📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* SELECTION CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. BATCH SELECTOR (Smart Naming with WP) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Class / Batch</label>
              <select 
                className="w-full p-3 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">-- Select Class --</option>
                
                {/* LOADING STATE */}
                {loading && <option disabled>↻ Loading Classes...</option>}
                
                {/* EMPTY STATE */}
                {!loading && batches.length === 0 && <option disabled>⚠ No Classes Found</option>}
                
                {/* DATA MAPPING */}
                {batches.map(b => {
                   // A. Start with Semester & Dept (e.g. "S1 EEE")
                   let displayName = (b.semester && b.department) 
                      ? `${b.semester} ${b.department}` 
                      : b.name || "Unnamed Class";

                   // B. Add (WP) tag if Working Professional
                   if (b.type === 'WP') {
                      displayName += " (WP)";
                   }

                   // C. Append Year for clarity (e.g. "2025-2028")
                   // Only add if b.name is actually the year (which it is from Admin form)
                   if (b.name && !displayName.includes(b.name)) {
                      displayName += ` (${b.name})`; 
                   }
                   
                   return <option key={b.id} value={b.id}>{displayName}</option>
                })}
              </select>
              
              {!loading && batches.length === 0 && (
                 <p className="text-[10px] text-red-500 mt-1">
                   * No classes found. Ask Admin to create Batches.
                 </p>
              )}
            </div>

            {/* 2. SUBJECT SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
              <select 
                className="w-full p-3 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition disabled:opacity-50"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedBatch} 
              >
                <option value="">-- Select Subject --</option>
                {!selectedBatch && <option disabled>Select Class First ⬆</option>}
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.subjectName} ({s.code})</option>
                ))}
              </select>
            </div>

            {/* 3. HOUR SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hour</label>
              <select 
                className="w-full p-3 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7].map(h => (
                  <option key={h} value={h}>Hour {h}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* STUDENT LIST PLACEHOLDER */}
        {selectedBatch && selectedSubject ? (
          <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl text-center">
            <h3 className="text-blue-800 font-bold text-lg">Class Selected!</h3>
            <p className="text-blue-600 text-sm">Fetching student list...</p>
          </div>
        ) : (
          <div className="text-center p-12 bg-slate-100 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400 font-medium">Select a <span className="text-slate-600 font-bold">Class</span> and <span className="text-slate-600 font-bold">Subject</span> to start.</p>
          </div>
        )}

      </div>
    </div>
  );
}