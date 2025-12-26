// src/app/dashboard/subjects/page.tsx
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [selectedDept, setSelectedDept] = useState("EEE");
  const [selectedSem, setSelectedSem] = useState("S1");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "", // e.g. 4031
    type: "Theory" // Theory or Lab
  });

  // 1. Fetch Departments
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "departments"), orderBy("code")), (snap) => {
      setDepartments(snap.docs.map(d => d.data()));
    });
    return () => unsub();
  }, []);

  // 2. Fetch Subjects based on Filters
  useEffect(() => {
    // Query: Give me subjects where dept == 'EEE' AND semester == 'S4'
    const q = query(
      collection(db, "subjects"),
      where("dept", "==", selectedDept),
      where("semester", "==", selectedSem)
    );

    const unsub = onSnapshot(q, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedDept, selectedSem]);

  // 3. Add Subject
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "subjects"), {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        dept: selectedDept,
        semester: selectedSem,
        createdAt: new Date().toISOString()
      });
      setFormData({ name: "", code: "", type: "Theory" }); // Reset form
    } catch (error) {
      console.error(error);
      alert("Failed to add subject");
    } finally {
      setLoading(false);
    }
  };

  // 4. Delete Subject
  const handleDelete = async (id: string) => {
    if (confirm("Delete this subject?")) {
      await deleteDoc(doc(db, "subjects", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center mb-8">
          <button onClick={() => router.back()} className="mr-4 text-slate-500 hover:text-blue-900">← Back</button>
          <h1 className="text-2xl font-bold text-slate-800">Curriculum & Subjects</h1>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">DEPARTMENT</label>
            <select 
              value={selectedDept} 
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-4 py-2 border rounded-lg font-bold text-blue-900 bg-blue-50"
            >
              {departments.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">SEMESTER</label>
            <select 
              value={selectedSem} 
              onChange={(e) => setSelectedSem(e.target.value)}
              className="px-4 py-2 border rounded-lg font-bold text-blue-900 bg-blue-50"
            >
              {["S1","S2","S3","S4","S5","S6"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ADD FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">
            Add Subject to {selectedDept} - {selectedSem}
          </h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
            
            <div className="w-24">
              <label className="text-xs font-bold text-slate-500">Code</label>
              <input 
                placeholder="2001" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-black font-mono"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500">Subject Name</label>
              <input 
                placeholder="e.g. Electrical Machines I" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-black"
              />
            </div>

            <div className="w-32">
              <label className="text-xs font-bold text-slate-500">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg text-black bg-white"
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab / Practical</option>
              </select>
            </div>

            <button disabled={loading} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 h-[42px]">
              {loading ? "+" : "Add"}
            </button>
          </form>
        </div>

        {/* SUBJECT LIST */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-500 text-sm uppercase">
                <tr>
                  <th className="p-4 w-24">Code</th>
                  <th className="p-4">Subject Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-600">{sub.code}</td>
                    <td className="p-4 font-bold text-blue-900">{sub.name}</td>
                    <td className="p-4">
                      {sub.type === "Lab" ? 
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200">Lab</span> : 
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Theory</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(sub.id)} className="text-red-300 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No subjects found for {selectedDept} {selectedSem}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>

      </div>
    </div>
  );
}