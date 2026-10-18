'use server';
import {z} from 'zod';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {supabase,configured,admin} from '@/lib/supabase/server';
import {requireUser} from '@/lib/data';
const authSchema=z.object({email:z.email().max(254),password:z.string().min(8).max(128),mode:z.enum(['login','signup','reset'])});
export async function authenticate(_prev:{message:string},form:FormData):Promise<{message:string}> {
  if(!configured()) return {message:'Supabase n’est pas encore configuré. Les variables sont volontairement vides.'};
  const parsed=authSchema.safeParse(Object.fromEntries(form));
  if(!parsed.success) return {message:'Entre un courriel valide et un mot de passe d’au moins 8 caractères.'};
  const {email,password,mode}=parsed.data; const db=await supabase();
  if(mode==='reset') {
    const {error}=await db.auth.resetPasswordForEmail(email);
    return {message:error?'Impossible d’envoyer le courriel. Réessaie plus tard.':'Si ce compte existe, un courriel de récupération a été envoyé.'};
  }
  if(mode==='signup') {
    const {data,error}=await db.auth.signUp({email,password});
    if(error) return {message:'Inscription impossible. Vérifie les informations et réessaie.'};
    if(!data.session) return {message:'Vérifie ton courriel pour confirmer ton compte, puis connecte-toi.'};
  } else {
    const {error}=await db.auth.signInWithPassword({email,password});
    if(error) return {message:'Courriel ou mot de passe incorrect, ou compte non confirmé.'};
  }
  redirect('/onboarding/finish');
}
export async function signOut(){const db=await supabase();await db.auth.signOut();redirect('/');}
const preferences=z.object({
  display_name:z.string().trim().min(1).max(40),goal:z.enum(['basics','career','projects','improve','curiosity']),
  daily_goal:z.coerce.number().refine(n=>[5,10,15,30].includes(n)),dark_mode:z.boolean(),sound:z.boolean(),leaderboard_visible:z.boolean()
});
export async function saveSettings(_prev:{message:string},form:FormData) {
  const {user}=await requireUser(); const parsed=preferences.safeParse({
    ...Object.fromEntries(form),dark_mode:form.get('dark_mode')==='on',sound:form.get('sound')==='on',leaderboard_visible:form.get('leaderboard_visible')==='on'
  });
  if(!parsed.success) return {message:'Vérifie le nom et les préférences.'};
  const {display_name,...settings}=parsed.data; const db=admin();
  const result=await db.from('profiles').update({display_name}).eq('id',user.id);
  if(result.error) return {message:'Enregistrement du profil impossible.'};
  const s=await db.from('user_settings').update(settings).eq('user_id',user.id);
  if(s.error) return {message:'Enregistrement des préférences impossible.'};
  revalidatePath('/','layout'); return {message:'Préférences enregistrées.'};
}
export async function saveOnboarding(goal:string) {
  const {user}=await requireUser();
  const parsed=z.enum(['basics','career','projects','improve','curiosity']).safeParse(goal);
  if(!parsed.success) return {error:'Objectif invalide.'};
  const {error}=await admin().from('user_settings').update({goal:parsed.data,languages:['JavaScript']}).eq('user_id',user.id);
  if(error) return {error:'Impossible de sauvegarder ton objectif.'};
  revalidatePath('/home'); return {ok:true};
}
export async function updatePassword(_prev:{message:string},form:FormData) {
  await requireUser(); const value=z.string().min(8).max(128).safeParse(form.get('password'));
  if(!value.success) return {message:'Utilise au moins 8 caractères.'};
  const db=await supabase();const {error}=await db.auth.updateUser({password:value.data});
  return {message:error?'Modification impossible. Reconnecte-toi puis réessaie.':'Mot de passe modifié.'};
}
