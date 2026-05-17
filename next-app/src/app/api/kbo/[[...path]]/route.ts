import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path || [];
  const subPath = pathSegments.join("/");
  
  const searchParams = request.nextUrl.searchParams.toString();
  // Build the target endpoint on the external Vercel server
  const targetUrl = `https://kboserver.vercel.app/api/kbo${subPath ? `/${subPath}` : ""}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 5 }, // cache for 5 seconds to reduce rate limits while maintaining near real-time updates
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `KBO API returned status ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("KBO API Proxy Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from KBO server" },
      { status: 500 }
    );
  }
}
