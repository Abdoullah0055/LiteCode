import 'server-only';
import {NextResponse,type NextRequest} from 'next/server';
import {supabase,configured,admin} from './supabase/server';
export class ApiError extends Error {constructor(message:string,public status=400){super(message);}}
export async function apiContext(request:NextRequest,lessonId:string) {
  if(request.headers.get('origin')&&request.headers.get('origin')!==request.nextUrl.origin) throw new ApiError('Origine refusée.',403);
  if(!configured()) throw new ApiError('Supabase non configuré.',503);
  const db=await supabase(); const {data:{user}}=await db.auth.getUser();
  if(!user) throw new ApiError('Connecte-toi pour continuer.',401);
  const server=admin();
  const {data:lesson,error}=await db.from('lessons').select('id,type,xp').eq('id',lessonId).maybeSingle();
  if(error) throw new ApiError('Parcours indisponible.',503);
  if(!lesson) throw new ApiError('Activité introuvable.',404);
  const [p,r]=await Promise.all([db.from('user_progress').select('lesson_id,completed_at').eq('user_id',user.id).not('completed_at','is',null),db.from('prerequisites').select('required_lesson_id').eq('lesson_id',lessonId)]);
  if(p.error||r.error) throw new ApiError('Impossible de vérifier les prérequis.',503);
  const done=new Set((p.data||[]).map(x=>x.lesson_id));
  if((r.data||[]).some(x=>!done.has(x.required_lesson_id))) throw new ApiError('Termine les activités précédentes.',403);
  return {db,server,user,lesson};
}
export function apiFailure(error:unknown) {
  if(error instanceof ApiError) return NextResponse.json({error:error.message},{status:error.status});
  return NextResponse.json({error:'La demande n’a pas pu être traitée. Vérifie les données et réessaie.'},{status:400});
}
