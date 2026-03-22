import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Daily.co API key not configured" }, { status: 500 });
  }

  try {
    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    // Use a stable room name based on the study room ID
    const roomName = `pupilnetwork-${roomId.slice(0, 12)}`;

    // Try to get existing room first
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      return NextResponse.json({ url: existing.url, name: existing.name });
    }

    // Create a new Daily room
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // Expires in 3 hours
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return NextResponse.json({ error: err?.info || "Failed to create room" }, { status: 500 });
    }

    const room = await createRes.json();
    return NextResponse.json({ url: room.url, name: room.name });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
