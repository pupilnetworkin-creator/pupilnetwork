"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { FileText, Search, Plus, Download, BookOpen, User, Calendar, Loader2 } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const subjects = ["All", "Math", "Science", "History", "Physics", "Chemistry", "Computer Science", "Biology", "Literature", "Others"];

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*, profiles(username)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", JSON.stringify(error, null, 2));
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "All" || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3">
            <FileText className="text-yellow-500" size={32} />
            Academic Notes
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Share your knowledge, help others, and earn points.</p>
        </div>
        <Link 
          href="/notes/upload" 
          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-yellow-500/20 hover:-translate-y-1"
        >
          <Plus size={20} /> Upload Notes
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search notes by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
          />
        </div>
        <select 
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500 transition-all min-w-[180px]"
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-yellow-500 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-bold animate-pulse">Scanning the library...</p>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col hover:border-yellow-500/50 transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                  {note.subject}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{note.title}</h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">
                {note.description || "No description provided."}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User size={14} />
                  <span>By <strong className="text-gray-300">{note.profiles?.username || "Pupil"}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <a 
                href={note.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all border border-gray-700 hover:border-yellow-500/30"
              >
                <Download size={18} /> Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[40px]">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600">
            <FileText size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No notes found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Be the first to share your notes and help out your fellow students!</p>
          <Link 
            href="/notes/upload" 
            className="inline-block mt-8 text-yellow-500 font-bold hover:underline"
          >
            Go to Upload Page →
          </Link>
        </div>
      )}
    </div>
  );
}
