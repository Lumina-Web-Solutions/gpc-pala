"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function BatchManager() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  
  // FORM DATA
  const [formData, setFormData] = useState({
    name: "",          // e.g. "2025-2028"
    department: "",    // e.g. "EEE"
    semester: "S1",    // e.g. "S1"
    type: "Regular"    // NEW: "Regular" or "WP" (Working Professional)
  });

  // 1. Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch Departments
    const deptSnap = await getDocs(collection(db, "departments"));
    const deptList = deptSnap.docs.map(d => d.data().name);
    setDepts(deptList);
    if(deptList.length > 0) setFormData(prev => ({...prev, department: deptList[0]}));

    // Fetch Batches
    const batchSnap = await getDocs(query(collection(db, "batches"), orderBy("name")));
    setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // 2. Create Batch
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.department) return alert("Fill all fields");

    // Auto-generate Display Name
    // Regular: "S1 EEE"
    // WP:      "S1 EEE (WP)"
    let displayName = `${formData.semester} ${formData.department}`;
    if (formData.type === "WP") {
      displayName += " (WP)";
    }

    try {
      await addDoc(collection(db, "batches"), {
        name: formData.name,            // Year (2025-2028)
        department: formData.department,
        semester: formData.semester,
        type: formData.type,            // Save the type!
        displayName: displayName,       // Pre-calculated name
        createdAt: new Date()
      });
      alert(`${formData.type === 'WP' ? 'Working Professional' : 'Regular'} Batch Created!`);
      fetchData();
      setFormData(prev => ({ ...prev, name: "" })); // Reset name only
    } catch (e) {
      console.error(e);
      alert("Error creating batch");
    }
  };

  // 3. Delete Batch
  const handleDelete = async (id: string) => {
    if(!confirm("Delete this batch? Current students will be orphaned.")) return;
    await deleteDoc(doc(db, "batches", id));
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="bg-white p-2 rounded-full border text-slate-600">⬅</button>
          <h1 className="text-3xl font-bold text-slate-800">Batch Manager</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: CREATE FORM */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-xl font-bold mb-4 text-[#1A3B8C]">Create New Class</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* 1. PROGRAM TYPE (NEW) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Program Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "Regular"})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
                      formData.type === "Regular" 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: "WP"})}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${
                      formData.type === "WP" 
                      ? "bg-purple-600 text-white border-purple-600" 
                      : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    Working Prof.
                  </button>
                </div>
              </div>

              {/* 2. SEMESTER */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current Semester</label>
                <div className="grid grid-cols-3 gap-2">
                  {['S1','S2','S3','S4','S5','S6'].map(sem => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setFormData({...formData, semester: sem})}
                      className={`p-2 rounded-lg text-sm font-bold border transition ${
                        formData.semester === sem 
                        ? 'bg-[#1A3B8C] text-white border-[#1A3B8C]' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. DEPARTMENT */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Department</label>
                <select 
                  className="w-full p-3 border rounded-lg font-bold bg-slate-50"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* 4. YEAR */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Batch Year</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2025-2028"
                  className="w-full p-3 border rounded-lg bg-slate-50 font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-200 transition">
                Create {formData.type === 'WP' ? 'WP' : 'Regular'} Class
              </button>
            </form>
          </div>

          {/* RIGHT: LIST */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Class Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Year</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <span className="font-bold text-lg text-[#1A3B8C]">
                          {b.semester} {b.department}
                          {/* Visual Tag for WP */}
                          {b.type === 'WP' && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">WP</span>}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-500">
                        {b.type === 'WP' ? 'Working Prof.' : 'Regular'}
                      </td>
                      <td className="p-4 font-medium text-slate-500">
                        {b.name}
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDelete(b.id)} className="text-red-500 font-bold text-sm hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">No classes found. Add one!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}