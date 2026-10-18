import {NextResponse,type NextRequest} from 'next/server';
import {z} from 'zod';
import {apiContext,apiFailure,ApiError} from '@/lib/api';
import {gradeAnswers} from '@/lib/domain';
import {executeCode} from '@/lib/execution';
import type {TestResult} from '@/lib/types';
const submission=z.object({code:z.string().max(20000).optional(),answers:z.record(z.string(),z.string().max(500)).optional()}).strict();
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    if(Number(request.headers.get('content-length')||0)>24000) throw new ApiError('Soumission trop longue.',413);
    const {id}=await params;const {server,user,lesson}=await apiContext(request,id);
    const input=submission.parse(await request.json());
    const {data:attemptId,error}=await server.rpc('begin_attempt',{p_user:user.id,p_lesson:id,p_submission:input});
    if(error) throw new ApiError(error.message.includes('Too many')?'Trop de tentatives. Attends une minute.':'Cette activité ne peut pas encore être envoyée.',error.message.includes('Too many')?429:403);
    let results:TestResult[];let passed=false;
    try {
      if(['coding_challenge','debugging_exercise','project'].includes(lesson.type)) {
        if(!input.code?.trim()) throw new ApiError('Écris du code avant de lancer les tests.');
        const {data:cases,error}=await server.from('test_cases').select('label,args,expected').eq('lesson_id',id).order('position');
        if(error||!cases?.length) throw new Error('Les tests ne sont pas disponibles.');
        results=await executeCode(input.code,cases);passed=results.every(x=>x.passed);
      } else {
        const {data:questions,error}=await server.from('questions').select('id,prompt').eq('lesson_id',id).order('position');
        if(error||!questions?.length) throw new Error('Les questions ne sont pas disponibles.');
        const {data:keys,error:keyError}=await server.from('question_keys').select('*').in('question_id',questions.map(q=>q.id));
        if(keyError||keys?.length!==questions.length) throw new Error('Correction indisponible.');
        results=questions.map(q=>{const key=keys!.find(k=>k.question_id===q.id)!;const ok=gradeAnswers([{id:q.id,answer:key.answer}],input.answers||{});return {label:q.prompt,passed:ok,error:ok?undefined:key.explanation};});
        passed=results.every(r=>r.passed);
      }
    } catch(error) {
      const finished=await server.rpc('finish_attempt',{p_user:user.id,p_attempt:attemptId,p_status:'unavailable',p_results:[]});
      if(finished.error) throw new ApiError('Le service est indisponible et la tentative n’a pas pu être finalisée.',503);
      throw new ApiError(error instanceof Error?error.message:'Vérification indisponible.',error instanceof ApiError?error.status:503);
    }
    const {data:reward,error:finishError}=await server.rpc('finish_attempt',{p_user:user.id,p_attempt:attemptId,p_status:passed?'passed':'failed',p_results:results});
    if(finishError) throw new ApiError('Résultat non enregistré. Réessaie ; aucune récompense ne sera doublée.',503);
    return NextResponse.json({attemptId,passed,results,xp:Number(reward.xp||0)});
  } catch(error){return apiFailure(error);}
}
