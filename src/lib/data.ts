import 'server-only';
import {cache} from 'react';
import {redirect} from 'next/navigation';
import {supabase,configured} from './supabase/server';
import type {LearningData,Settings} from './types';
export const requireUser=cache(async()=>{
  if(!configured()) redirect('/setup');
  const db=await supabase(); const {data:{user},error}=await db.auth.getUser();
  if(error||!user) redirect('/auth');
  return {db,user};
});
export const learningData=cache(async():Promise<LearningData>=>{
  const {db,user}=await requireUser();
  const [l,m,p,r]=await Promise.all([
    db.from('lessons').select('*').order('position'),db.from('modules').select('id,title,position').order('position'),
    db.from('user_progress').select('*').eq('user_id',user.id),db.from('prerequisites').select('lesson_id,required_lesson_id')
  ]);
  for(const result of [l,m,p,r]) if(result.error) throw new Error('Impossible de charger le parcours. Vérifie les migrations et les droits de lecture.');
  return {lessons:l.data||[],modules:m.data||[],progress:p.data||[],prerequisites:r.data||[]} as LearningData;
});
export const accountData=cache(async()=>{
  const {db,user}=await requireUser();
  const [p,s,x,t,a,f]=await Promise.all([
    db.from('profiles').select('*').eq('id',user.id).single(),db.from('user_settings').select('*').eq('user_id',user.id).single(),
    db.from('user_xp_events').select('amount,created_at').eq('user_id',user.id),db.from('user_streaks').select('*').eq('user_id',user.id).single(),
    db.from('user_achievements').select('achievement_id,earned_at,achievements(title,description,icon)').eq('user_id',user.id),
    db.from('exercise_attempts').select('status').eq('user_id',user.id).eq('status','failed').gte('created_at',new Date().toISOString().slice(0,10))
  ]);
  for(const result of [p,s,x,t,a,f]) if(result.error) throw new Error('Impossible de charger le compte.');
  return {name:p.data!.display_name as string,settings:s.data as Settings,xp:(x.data||[]).reduce((n,e)=>n+Number(e.amount),0),
    streak:{current:Number(t.data?.current_streak||0),longest:Number(t.data?.longest_streak||0),last:t.data?.last_activity_date as string|null},
    achievements:(a.data||[]) as unknown as {achievement_id:string;earned_at:string;achievements:{title:string;description:string;icon:string}}[],
    xpToday:(x.data||[]).filter(e=>String(e.created_at).slice(0,10)===new Date().toISOString().slice(0,10)).reduce((n,e)=>n+Number(e.amount),0),
    hearts:Math.max(0,5-(f.data?.length||0)),user};
});
