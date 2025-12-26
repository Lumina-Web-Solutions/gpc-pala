// src/app/dashboard/departments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DepartmentsPage() {
  const router = useRouter();
  const [depts, setDepts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Departments (Real-time Connection)
  useEffect(() => {
    const q = query(collection(db, "departments"), orderBy("code"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deptList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepts(deptList);
    });
    return () => unsubscribe();
  }, []);

  // 2. Add New Department
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !code) return;
    setLoading(true);
    
    try {
      // Create document in "departments" collection
      await addDoc(collection(db, "departments"), {
        name: name,
        code: code.toUpperCase(), // e.g., "EEE"
        createdAt: new Date().toISOString()
      });
      setName("");
      setCode("");
    } catch (error) {
      console.error("Error adding:", error);
      alert("Failed to add department");
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Department
  const handleDelete = async (id: string) => {
    if(confirm("Are you sure? This will delete the department.")) {
      await deleteDoc(doc(db, "departments", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button onClick={() => router.back()} className="mr-4 text-slate-500 hover:text-blue-900">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Manage Departments</h1>
        </div>

        {/* Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase mb-4">Add New Department</h2>
          <form onSubmit={handleAdd} className="flex gap-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code (e.g. EEE)"
              className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 text-black uppercase"
              required
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (e.g. Electrical & Electronics)"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 text-black"
              required
            />
            <button 
              disabled={loading}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800"
            >
              {loading ? "+" : "Add"}
            </button>
          </form>
        </div>

        {/* Departments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depts.map((dept) => (
            <div key={dept.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group">
              <div>
                <h3 className="text-xl font-bold text-blue-900">{dept.code}</h3>
                <p className="text-slate-500 text-sm">{dept.name}</p>
              </div>
              <button 
                onClick={() => handleDelete(dept.id)}
                className="text-red-200 hover:text-red-600 transition-colors p-2"
                title="Delete Department"
              >
                Delete
              </button>
            </div>
          ))}
          
          {depts.length === 0 && (
            <p className="text-slate-400 text-center col-span-2 py-10">
              No departments found. Add one above!
            </p>
          )}
        </div>

      </div>
    </div>
  );
}