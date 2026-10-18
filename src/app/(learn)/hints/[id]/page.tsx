import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/data';
import {HintPanel} from '@/components/exercise';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const {db}=await requireUser();const {data}=await db.from('lessons').select('id').eq('id',id).maybeSingle();if(!data)notFound();return <div className="screen-page" style={{background:'#253d4e',justifyContent:'center',padding:20}}><HintPanel id={id}/></div>;}
