import {notFound} from 'next/navigation';
import {accountData,learningData,requireUser} from '@/lib/data';
import {isUnlocked} from '@/lib/domain';
import {Exercise} from '@/components/exercise';
import {ButtonLink,Empty} from '@/components/ui';
import type {Challenge,Question} from '@/lib/types';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const [data,a,{db}]=await Promise.all([learningData(),accountData(),requireUser()]);const l=data.lessons.find(x=>x.id===id);if(!l)notFound();
 if(!isUnlocked(data.prerequisites.filter(p=>p.lesson_id===id).map(p=>p.required_lesson_id),data.progress.filter(p=>p.completed_at).map(p=>p.lesson_id)))return <div className="page-content"><Empty title="Activité verrouillée"><p>Termine les prérequis.</p><ButtonLink href="/path">Mon parcours</ButtonLink></Empty></div>;
 const [q,c]=await Promise.all([db.from('questions').select('id,prompt,kind,answer_options(id,label,value,position)').eq('lesson_id',id).order('position'),db.from('challenges').select('starter_code,steps,language').eq('lesson_id',id).maybeSingle()]);
 if(q.error||c.error)throw new Error('Exercice indisponible.');
 if(!c.data&&!q.data?.length)throw new Error('Cette activité ne dispose pas encore de validation.');
 return <Exercise lesson={l} questions={(q.data||[]) as Question[]} challenge={c.data as Challenge|null} progress={data.progress.find(p=>p.lesson_id===id)||null} hearts={a.hearts}/>;
}
