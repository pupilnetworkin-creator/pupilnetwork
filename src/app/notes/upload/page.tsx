"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, CheckCircle2, Loader2, Sparkles, Shield, Info, Plus } from "lucide-react";

export default function UploadNotePage() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Math");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const subjects = ["Math", "Science", "History", "Physics", "Chemistry", "Computer Science", "Biology", "Literature", "Others"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });
  }, [router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !user) return;

    setUploading(true);

    try {
      // 1. Upload file to Storage Bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("notes_files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("notes_files")
        .getPublicUrl(filePath);

      // 3. Insert into Database
      const { error: dbError } = await supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        file_url: publicUrl,
        file_type: fileExt,
        subject: subject,
        points_awarded: 15
      });

      if (dbError) throw dbError;

      // 4. Award Points (+15 Points)
      const { data: profile } = await supabase.from("profiles").select("points").eq("id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ points: (profile.points || 0) + 15 }).eq("id", user.id);
      }

      setSuccess(true);
      setTimeout(() => router.push("/notes"), 2000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center px-4">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
          <CheckCircle2 size={64} className="animate-bounce" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">Upload Complete!</h1>
        <p className="text-xl text-gray-400">You've just earned <strong className="text-yellow-500">+15 Study Points</strong>. Redirecting to library...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20">
      <Link href="/notes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Library
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
          <Upload className="text-yellow-500" size={32} />
          Collaborate & Share
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Help your peers by uploading your study materials.</p>
      </div>

      <form onSubmit={handleUpload} className="space-y-8 bg-gray-900 border border-gray-800 p-8 sm:p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full"></div>
        
        {/* Title */}
        <div className="space-y-3">
          <label className="block text-sm font-bold tracking-wider text-gray-400 uppercase">Document Title</label>
          <input 
            type="text" 
            required
            placeholder="e.g., Organic Chemistry Midterm Summary"
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Subject */}
          <div className="space-y-3">
            <label className="block text-sm font-bold tracking-wider text-gray-400 uppercase">Subject</label>
            <select 
              className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-yellow-500 transition-all font-medium appearance-none"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Points Bonus Badge */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-4">
            <Sparkles className="text-yellow-500" size={32} />
            <div>
              <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Community Bonus</p>
              <p className="text-sm font-extrabold text-white">Earn +15 Points for this upload!</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="block text-sm font-bold tracking-wider text-gray-400 uppercase">Brief Description</label>
          <textarea 
            rows={4}
            placeholder="What should other students know about this document?"
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-6 py-4 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* File Drop Area */}
        <div className={`relative border-2 border-dashed rounded-[32px] p-10 transition-all cursor-pointer group ${file ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-800 hover:border-gray-700 bg-black/20'}`}>
          <input 
            type="file" 
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center text-center">
            {file ? (
              <>
                <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-black mb-4 shadow-xl shadow-yellow-500/20">
                  <FileText size={32} />
                </div>
                <p className="text-white font-bold text-lg mb-1">{file.name}</p>
                <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to change file</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <p className="text-white font-bold text-lg mb-1">Click to browse notes</p>
                <p className="text-gray-500 text-xs uppercase tracking-widest">PDF, DOCX, IMG or ZIP (Max 50MB)</p>
              </>
            )}
          </div>
        </div>

        {/* Safety Notice */}
        <div className="flex items-start gap-3 text-gray-500 text-xs leading-relaxed px-2">
          <Shield size={16} className="shrink-0 text-gray-600" />
          <p>By uploading, you agree that this material is helpful for academic purposes and doesn't violate copyright or community guidelines. Please ensure no personal info is visible.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-500/20 hover:-translate-y-1 transform active:scale-95"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Securing & Uploading...
            </>
          ) : (
            <>
              Confirm & Share Note <Plus size={24} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
