"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function PromotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [targetSemester, setTargetSemester] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  // Load Batches (S1 EEE, S3 CT, etc.)
  useEffect(() => {
    const fetchBatches = async () => {
      const q = query(collection(db, "batches"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBatches(data);
    };
    fetchBatches();
  }, []);

  // Check how many students are in the selected batch
  useEffect(() => {
    if (!selectedBatch) return;
    const checkCount = async () => {
      const q = query(collection(db, "users"), where("batch", "==", selectedBatch));
      const snap = await getDocs(q);
      setStudentCount(snap.size);
    };
    checkCount();
  }, [selectedBatch]);

  const handlePromote = async () => {
    if (!selectedBatch || !targetSemester) return alert("Please select a batch and new semester!");
    if (!confirm(`Are you sure you want to promote ${studentCount} students?`)) return;

    setLoading(true);
    try {
      // 1. Get all students in the old batch
      const q = query(collection(db, "users"), where("batch", "==", selectedBatch));
      const snapshot = await getDocs(q);

      // 2. Update them all at once (Batch Write)
      const batchJob = writeBatch(db);
      
      snapshot.docs.forEach((studentDoc) => {
        const ref = doc(db, "users", studentDoc.id);
        // We update the 'batch' field to the new semester name
        batchJob.update(ref, { batch: targetSemester });
      });

      await batchJob.commit();
      alert("Success! Students have been promoted.");
      router.push("/dashboard"); // Go back home
    } catch (error) {
      console.error(error);
      alert("Error promoting students. Check console.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          🚀 Promote Class
        </h1>

        <div className="space-y-6">
          {/* Step 1: Select Current Class */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Current Batch (To Move)</label>
            <select 
              className="w-full p-3 border rounded-lg bg-slate-50"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">-- Choose Batch --</option>
              {batches.map((b: any) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
            {selectedBatch && <p className="text-sm text-blue-600 mt-2">Found {studentCount} students in this batch.</p>}
          </div>

          {/* Step 2: Type New Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Promote To (New Batch Name)</label>
            <input 
              type="text" 
              placeholder="e.g. S2 EEE (2024)" 
              className="w-full p-3 border rounded-lg"
              value={targetSemester}
              onChange={(e) => setTargetSemester(e.target.value)}
            />
          </div>

          <button 
            onClick={handlePromote} 
            disabled={loading || studentCount === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Promoting..." : "Promote Students Now"}
          </button>
        </div>
      </div>
    </div>
  );
}