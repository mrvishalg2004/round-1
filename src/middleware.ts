import { NextRequest, NextResponse } from 'next/server';

// Add a section to handle API errors and ensure they are always in JSON format
export function middleware(request: NextRequest) {
  // Existing middleware logic

  // For API routes, ensure proper JSON responses and error handling
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      // Continue with the request
      return NextResponse.next();
    } catch (error) {
      console.error('API error in middleware:', error);
      
      // Return a properly formatted JSON error response
      return new NextResponse(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  return NextResponse.next();
} 