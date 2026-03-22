import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Mock AI endpoint for MVP
// Rate limiting should ideally be handled using Redis (Upstash) and IP/UserID
// For MVP, we pass user ID and rely on a placeholder logic.

const userAiUsage: Record<string, { count: number, date: string }> = {};

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing prompt or user ID' }, { status: 400 });
    }

    // Fetch user profile to check Premium status
    let isPremium = false;
    try {
       // Using raw fetch logic or the supabase client imported
       const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', userId).single();
       if (profile?.is_premium) isPremium = true;
    } catch (e) { console.error("Could not fetch profile for rate limit check", e); }

    const today = new Date().toISOString().split('T')[0];
    
    if (!userAiUsage[userId]) {
      userAiUsage[userId] = { count: 0, date: today };
    }

    if (userAiUsage[userId].date !== today) {
      userAiUsage[userId] = { count: 0, date: today };
    }

    // Apply Rate Limiting ONLY if not premium
    if (!isPremium) {
      if (userAiUsage[userId].count >= 5) {
        return NextResponse.json({ error: 'Daily AI limit reached (5/5). Please upgrade to Premium for unlimited AI answers!' }, { status: 429 });
      }
      userAiUsage[userId].count += 1;
    }

    // Dual-Model AI Fallback Logic
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    let aiResponse = "";
    let primaryFailed = false;

    // First attempt: Groq (Ultra-fast Llama 3)
    if (GROQ_API_KEY) {
      try {
        const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              { role: "system", content: "You are an AI Study Assistant for a platform called PupilNetwork. Help the student with their study question concisely and encouragingly." },
              { role: "user", content: prompt }
            ]
          })
        });
        const aiData = await aiRes.json();
        
        if (aiData.error) {
           console.log(`Groq API Error: ${aiData.error.message}, falling back to Gemini...`);
           primaryFailed = true;
        } else if (aiData.choices && aiData.choices[0].message.content) {
          aiResponse = aiData.choices[0].message.content;
        }
      } catch (err: any) {
        console.error("Groq Fetch Error:", err);
        primaryFailed = true;
      }
    } else {
      primaryFailed = true;
    }

    // Second attempt: Gemini Fallback
    if (primaryFailed && GEMINI_API_KEY) {
      try {
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
              role: 'user', 
              parts: [{ text: `You are an AI Study Assistant for a platform called PupilNetwork. Help the student with their study question concisely and encouragingly: ${prompt}` }] 
            }]
          })
        });
        const aiData = await aiRes.json();
        
        if (aiData.error) {
           console.log(`Gemini API Error: ${aiData.error.message}`);
           aiResponse = `Dual AI Failure: Groq & Gemini (${aiData.error.message})`;
        } else if (aiData.candidates && aiData.candidates[0].content.parts[0].text) {
          aiResponse = aiData.candidates[0].content.parts[0].text;
        }
      } catch (err: any) {
        console.error("Gemini Fetch Error:", err);
      }
    }

    // Final Fallback Mock
    if (!aiResponse) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      aiResponse = "I'm your AI Study Assistant! That is a great question. In brief, " + prompt + " can be understood as a fundamental concept in your coursework. Keep practicing!";
      if (prompt.toLowerCase().includes("equation")) {
        aiResponse = "To balance an equation, make sure the number of atoms for each element is the same on both the reactant and product sides. Let me know if you have a specific equation!";
      }
    }

    return NextResponse.json({ 
      response: aiResponse,
      usage: {
        used: isPremium ? 'Unlimited' : userAiUsage[userId].count,
        limit: isPremium ? 'Unlimited' : 5,
        isPremium
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
