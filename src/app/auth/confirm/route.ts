import {type EmailOtpType} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
import {supabase} from '@/lib/supabase/server';
export async function GET(request:NextRequest) {
  const url=request.nextUrl;const token=url.searchParams.get('token_hash');const type=url.searchParams.get('type') as EmailOtpType|null;
  const code=url.searchParams.get('code'); const db=await supabase();
  const result=code?await db.auth.exchangeCodeForSession(code):token&&type?await db.auth.verifyOtp({token_hash:token,type}):null;
  if(result&&!result.error) return NextResponse.redirect(new URL(type==='recovery'?'/settings':'/onboarding/finish',url.origin));
  return NextResponse.redirect(new URL('/auth?error=confirmation',url.origin));
}
