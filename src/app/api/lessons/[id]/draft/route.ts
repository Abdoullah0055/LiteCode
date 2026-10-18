import {NextResponse,type NextRequest} from 'next/server';
import {z} from 'zod';
import {apiContext,apiFailure,ApiError} from '@/lib/api';
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params;const {server,user}=await apiContext(request,id);
    const {code}=z.object({code:z.string().max(20000)}).strict().parse(await request.json());
    const {error}=await server.from('user_progress').upsert({user_id:user.id,lesson_id:id,draft_code:code,updated_at:new Date().toISOString()},{onConflict:'user_id,lesson_id'});
    if(error) throw new ApiError('Brouillon non sauvegardé.',503);
    return NextResponse.json({saved:true});
  }catch(error){return apiFailure(error);}
}
