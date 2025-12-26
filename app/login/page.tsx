"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Ensure this path is correct
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check Role
      const docSnap = await getDoc(doc(db, "users", user.uid));
      
      if (docSnap.exists()) {
        const role = docSnap.data().role;
        // Redirect based on role
        if (role === 'student') router.push('/'); // Student Home
        else router.push('/dashboard'); // Admin/Faculty Dashboard
      } else {
        // Fallback for Admins who might not have a Firestore doc yet
        router.push('/dashboard');
      }

    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid Email or Password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      
      {/* 1. LOGIN CARD */}
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 relative">
             {/* Make sure logo.png exists in your public folder */}
             <Image 
               src="/logo.png" 
               alt="GPTC Logo" 
               fill 
               className="object-contain"
             />
          </div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">GPTC Pala</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">Digital Campus Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-6 font-bold border border-red-100">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">User ID / Admission No</label>
            <input 
              type="text" 
              placeholder="Enter E-Mail " 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Secure Login"
            )}
          </button>
        </form>

      </div>

      {/* 2. FOOTER SECTION (Centered at Bottom) */}
      <div className="mt-12 text-center space-y-2">
        <p className="text-slate-400 text-sm font-medium">
          © 2025 Govt Polytechnic College Pala
        </p>
        
        {/* Lumina Web Solutions Branding */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
          <span>Powered by</span>
          <a 
            href="https://luminaweb.online" // Replace with your actual URL
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500 font-bold transition-colors flex items-center gap-1"
          >
             Lumina Web Solutions
          </a>
        </div>
      </div>

    </div>
  );
}