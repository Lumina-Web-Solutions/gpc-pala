"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FacultyManager() {
  const router = useRouter();

  // --- DATA STATE ---
  const [faculty, setFaculty] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- FILTER STATE ---
  const [filterDept, setFilterDept] = useState("");

  // --- FORM STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    phone: "",
    designation: "Lecturer"
  });

  // 1. FETCH DATA
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fSnap = await getDocs(collection(db, "faculty"));
      setFaculty(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const dSnap = await getDocs(collection(db, "departments"));
      setDepts(dSnap.docs.map(d => d.data().name));
    } catch (e) { console.error(e); }
  };

  // 2. SUBMIT HANDLER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department) {
      return alert("Please fill Name, Email, and Department.");
    }

    setLoading(true);

    try {
      if (isEditMode && editId) {
        // --- EDIT MODE ---
        const payload: any = { ...formData, updatedAt: new Date() };
        delete payload.password;

        await updateDoc(doc(db, "faculty", editId), payload);
        alert("Faculty Updated Successfully!");

      } else {
        // --- CREATE MODE (API Call) ---
        const response = await fetch("/api/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        alert("Faculty Account Created! ✅");
      }

      closeModal();
      fetchData();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: any) => {
    setIsEditMode(true);
    setEditId(f.id);
    setFormData({
      name: f.name,
      email: f.email,
      password: "",
      department: f.department,
      phone: f.phone || "",
      designation: f.designation || "Lecturer"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this faculty member?")) return;
    await deleteDoc(doc(db, "faculty", id));
    fetchData();
  };

  const closeModal = () => {
    setIsModalOpen(false); setIsEditMode(false); setEditId(null);
    setFormData({ name: "", email: "", password: "", department: "", phone: "", designation: "Lecturer" });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const sortedList = filterDept ? faculty.filter(f => f.department === filterDept) : faculty;

    if (sortedList.length === 0) return alert("No faculty found.");

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Government Polytechnic College, Pala", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(14);
    doc.text("FACULTY LIST", pageWidth / 2, 23, { align: "center" });

    const tableData = sortedList.map((f, index) => [
      index + 1, f.name, f.designation || "Lecturer", f.department, f.phone || "-", f.email
    ]);

    autoTable(doc, {
      head: [['#', 'Name', 'Designation', 'Dept', 'Phone', 'Email']],
      body: tableData, startY: 35
    });
    doc.save(`Faculty_List.pdf`);
  };

  const viewFaculty = filterDept ? faculty.filter(f => f.department === filterDept) : faculty;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"><span>⬅</span> Back</button>
        <div><h1 className="text-xl font-bold text-slate-800 leading-none">Faculty Manager</h1><p className="text-xs text-slate-400 font-bold uppercase mt-1">Admin Console</p></div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div className="w-full md:w-auto">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Filter Department</label>
            <select className="w-full md:w-64 p-3 border border-slate-300 rounded-lg font-bold text-slate-700 bg-white shadow-sm" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="">-- All Departments --</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={downloadPDF} className="px-6 py-3 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition">📄 PDF</button>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-lg font-bold bg-purple-700 hover:bg-purple-900 text-white shadow-lg shadow-purple-200 transition">+ Add Faculty</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Designation</th>
                <th className="p-4">Department</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewFaculty.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-slate-400">No faculty found.</td></tr>}
              {viewFaculty.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition">
                  <td className="p-4"><div className="font-bold text-slate-800">{f.name}</div><div className="text-[10px] text-slate-400">{f.email}</div></td>
                  <td className="p-4 text-sm font-bold text-slate-600">{f.designation || "Lecturer"}</td>
                  <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{f.department}</span></td>
                  <td className="p-4 text-sm text-slate-600">{f.phone || "-"}</td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button onClick={() => handleEdit(f)} className="text-blue-600 font-bold text-xs hover:underline bg-blue-50 px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 font-bold text-xs hover:underline bg-red-50 px-3 py-1 rounded">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">{isEditMode ? "Edit Faculty" : "Add Faculty"}</h2><button onClick={closeModal} className="text-slate-400 hover:text-red-500 text-2xl">×</button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label><input type="text" className="w-full p-2 border rounded font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                    <input type="email" className="w-full p-2 border rounded font-bold" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                    <input type="tel" className="w-full p-2 border rounded font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                    <select className="w-full p-2 border rounded font-bold bg-white" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required>
                      <option value="">-- Select --</option>
                      {depts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Designation</label>
                    <select className="w-full p-2 border rounded font-bold bg-white" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}>
                      <option value="Lecturer">Lecturer</option>
                      <option value="HOD">HOD</option>
                      <option value="Demonstrator">Demonstrator</option>
                      <option value="Tradesman">Tradesman</option>
                    </select>
                  </div>
                </div>

                {!isEditMode && (
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Password</label><input type="password" className="w-full p-2 border rounded font-bold" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required /></div>
                )}

                <button disabled={loading} type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-lg mt-4 transition disabled:opacity-50">
                  {loading ? "Saving..." : isEditMode ? "Update Faculty" : "Create Faculty Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}