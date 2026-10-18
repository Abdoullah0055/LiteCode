import 'server-only';
import {z} from 'zod';
import type {TestResult} from './types';
const responseSchema=z.object({results:z.array(z.object({label:z.string(),passed:z.boolean(),error:z.string().optional(),actual:z.unknown().optional()}))});
export async function executeCode(code:string,cases:{label:string;args:unknown[];expected:unknown}[]):Promise<TestResult[]> {
  if(!process.env.RUNNER_URL||!process.env.RUNNER_API_KEY) throw new Error('Le service de vérification JavaScript n’est pas configuré. Aucune récompense n’a été accordée.');
  const response=await fetch(`${process.env.RUNNER_URL.replace(/\/$/,'')}/evaluate`,{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.RUNNER_API_KEY}`},
    body:JSON.stringify({code,cases}),signal:AbortSignal.timeout(8000),cache:'no-store'
  });
  if(!response.ok) throw new Error('Le service de vérification est indisponible. Réessaie plus tard.');
  const data=responseSchema.parse(await response.json());
  if(data.results.length!==cases.length||data.results.some((r,i)=>r.label!==cases[i].label)) throw new Error('Réponse du moteur invalide.');
  return data.results;
}
