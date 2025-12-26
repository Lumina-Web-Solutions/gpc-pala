"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentManager() {
  const router = useRouter();

  // --- DATA STATE ---
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // To show spinner
  
  // --- FILTER STATE ---
  const [filterBatch, setFilterBatch] = useState(""); 

  // --- FORM STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formDept, setFormDept] = useState(""); 
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", 
    regNo: "",    
    dob: "",
    phone: "",
    bloodGroup: "",
    studentType: "Regular",
    batchId: "",
  });

  // 1. FETCH DATA
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const batchSnap = await getDocs(query(collection(db, "batches"), orderBy("name")));
      setBatches(batchSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const deptSnap = await getDocs(collection(db, "departments"));
      setDepartments(deptSnap.docs.map(d => d.data().name));

      const studentSnap = await getDocs(collection(db, "students"));
      setStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  // 2. SORTING
  const getSortedStudents = (batchId: string) => {
    if (!batchId) return [];
    const batchStudents = students.filter(s => s.batchId === batchId);
    const regulars = batchStudents.filter(s => s.studentType !== 'LET').sort((a, b) => a.name.localeCompare(b.name));
    const lateralEntries = batchStudents.filter(s => s.studentType === 'LET').sort((a, b) => a.name.localeCompare(b.name));
    return [...regulars, ...lateralEntries];
  };

  // 3. SUBMIT FORM (CREATE via API / EDIT via Direct DB)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.batchId) {
      return alert("Please fill Name, Email, and Class.");
    }
    if (!isEditMode && !formData.password) {
      return alert("Password is required for new students.");
    }

    setLoading(true);

    try {
      const selectedBatch = batches.find(b => b.id === formData.batchId);
      const batchName = selectedBatch ? (selectedBatch.displayName || selectedBatch.name) : "Unknown";

      if (isEditMode && editId) {
        // --- EDIT MODE (Direct Firestore Update) ---
        // Note: Password update requires Admin SDK too, so we skip password here for simplicity
        // If you need password reset, we can add another API endpoint later.
        const payload: any = { ...formData, batchName, updatedAt: new Date() };
        delete payload.password; // Don't save password text to DB
        
        await updateDoc(doc(db, "students", editId), payload);
        alert("Student Updated Successfully!");
      
      } else {
        // --- CREATE MODE (Call API) ---
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            batchName
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        alert("Student Created & Account Activated! 🚀");
      }

      closeModal();
      fetchData(); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. EDIT & DELETE HANDLERS
  const handleEdit = (student: any) => {
    setIsEditMode(true);
    setEditId(student.id);
    setFormData({
      name: student.name, email: student.email, password: "", 
      regNo: student.regNo || "", dob: student.dob || "", phone: student.phone || "", 
      bloodGroup: student.bloodGroup || "", studentType: student.studentType || "Regular", batchId: student.batchId
    });
    const batch = batches.find(b => b.id === student.batchId);
    if (batch) setFormDept(batch.department);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false); setIsEditMode(false); setEditId(null);
    setFormData({ name: "", email: "", password: "", regNo: "", dob: "", phone: "", bloodGroup: "", studentType: "Regular", batchId: "" });
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? This only deletes the profile, not the login account.")) return;
    try { await deleteDoc(doc(db, "students", id)); fetchData(); } catch(e) { console.error(e); }
  }

  // 5. PDF DOWNLOAD
  const downloadPDF = () => {
    if (!filterBatch) return alert("Please SELECT A CLASS first.");
    const doc = new jsPDF();
    const sortedList = getSortedStudents(filterBatch);
    const selectedBatch = batches.find(b => b.id === filterBatch);
    if (sortedList.length === 0) return alert("No students found.");

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Government Polytechnic College, Pala", pageWidth / 2, 15, { align: "center" });
    
    doc.setFontSize(14);
    const deptName = selectedBatch?.department ? `Department of ${selectedBatch.department}` : "Department of Engineering";
    doc.text(deptName.toUpperCase(), pageWidth / 2, 23, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Semester: ${selectedBatch?.displayName || ""}`, 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 35, { align: "right" });

    const tableData = sortedList.map((s, index) => [
      index + 1, s.regNo || "-", s.name.toUpperCase(), s.studentType === 'LET' ? 'Lat. Entry' : 'Regular', s.phone || "-", s.bloodGroup || "-"
    ]);

    autoTable(doc, {
      head: [['Roll', 'Reg No', 'Name', 'Category', 'Phone', 'Blood']],
      body: tableData, startY: 40, theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center', fontStyle: 'bold' },
      bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
      columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 1: { halign: 'center' }, 5: { halign: 'center' } }
    });
    doc.save(`${selectedBatch?.displayName}_List.pdf`);
  };

  const formBatches = formDept ? batches.filter(b => b.department === formDept) : [];
  const viewStudents = filterBatch ? getSortedStudents(filterBatch) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"><span>⬅</span> Back</button>
        <div><h1 className="text-xl font-bold text-slate-800 leading-none">Student Manager</h1><p className="text-xs text-slate-400 font-bold uppercase mt-1">Admin Console</p></div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
           <div className="w-full md:w-auto">
             <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">View Class</label>
             <select className="w-full md:w-64 p-3 border border-slate-300 rounded-lg font-bold text-slate-700 bg-white shadow-sm" value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
              <option value="">-- Select Class --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.displayName || `${b.semester} ${b.department}`}</option>)}
            </select>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
             <button onClick={downloadPDF} disabled={!filterBatch} className="px-6 py-3 rounded-lg font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition">📄 PDF</button>
             <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 rounded-lg font-bold bg-[#1A3B8C] hover:bg-blue-900 text-white shadow-lg shadow-blue-200 transition">+ Add Student</button>
           </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-4 w-16 text-center">Roll</th>
                <th className="p-4 text-center">Reg No</th>
                <th className="p-4">Name</th>
                <th className="p-4 text-center">Category</th>
                <th className="p-4">Phone</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filterBatch && viewStudents.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-400">No students found.</td></tr>}
              {!filterBatch && <tr><td colSpan={6} className="p-20 text-center text-slate-400">👈 Please select a Class from the dropdown.</td></tr>}
              {viewStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-slate-400 font-bold text-center">#{idx + 1}</td>
                  <td className="p-4 font-mono text-slate-600 text-sm text-center">{s.regNo || "-"}</td>
                  <td className="p-4"><div className="font-bold text-slate-800">{s.name}</div><div className="text-[10px] text-slate-400">{s.email}</div></td>
                  <td className="p-4 text-center"><span className={`text-[10px] font-bold px-2 py-1 rounded border ${s.studentType === 'LET' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{s.studentType === 'LET' ? 'Lateral' : 'Regular'}</span></td>
                  <td className="p-4 text-sm text-slate-600">{s.phone}</td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button onClick={() => handleEdit(s)} className="text-blue-600 font-bold text-xs hover:underline bg-blue-50 px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 font-bold text-xs hover:underline bg-red-50 px-3 py-1 rounded">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800">{isEditMode ? "Edit Student" : "Add New Student"}</h2><button onClick={closeModal} className="text-slate-400 hover:text-red-500 text-2xl">×</button></div>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-blue-600 uppercase mb-3">1. Academic Selection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Department</label><select className="w-full p-2 border rounded font-bold text-slate-700" value={formDept} onChange={(e) => { setFormDept(e.target.value); setFormData({...formData, batchId: ""}); }}><option value="">-- Select Dept --</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Class <span className="text-red-500">*</span></label><select className="w-full p-2 border rounded font-bold text-slate-700 disabled:bg-slate-200" value={formData.batchId} onChange={(e) => setFormData({...formData, batchId: e.target.value})} disabled={!formDept}><option value="">-- Select Class --</option>{formBatches.map(b => <option key={b.id} value={b.id}>{b.displayName || b.name}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Category <span className="text-red-500">*</span></label><div className="flex gap-2">{['Regular', 'LET'].map(type => <button key={type} type="button" onClick={() => setFormData({...formData, studentType: type})} className={`flex-1 py-2 rounded text-sm font-bold border ${formData.studentType === type ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>{type === 'LET' ? 'Lateral Entry' : 'Regular'}</button>)}</div></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">2. Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Register No <span className="text-slate-400 text-[10px]">(Optional)</span></label><input type="text" className="w-full p-2 border rounded font-mono text-sm" value={formData.regNo} onChange={(e) => setFormData({...formData, regNo: e.target.value})}/></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Full Name <span className="text-red-500">*</span></label><input type="text" className="w-full p-2 border rounded font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required/></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">DOB</label><input type="date" className="w-full p-2 border rounded" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}/></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Blood Group</label><select className="w-full p-2 border rounded" value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}><option value="">-- Select --</option>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Phone</label><input type="tel" className="w-full p-2 border rounded" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <h3 className="text-xs font-bold text-yellow-700 uppercase mb-3">3. App Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Email <span className="text-red-500">*</span></label><input type="email" className="w-full p-2 border rounded bg-white" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required/></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Password {isEditMode ? <span className="text-slate-400 font-normal">(Optional)</span> : <span className="text-red-500">*</span>}</label><input type="text" className="w-full p-2 border rounded bg-white font-mono" placeholder={isEditMode ? "New Password" : "Password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}/></div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#1A3B8C] text-white font-bold rounded-lg hover:bg-blue-900 shadow-lg">{loading ? "Saving..." : (isEditMode ? "Update Student" : "Create Account")}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}