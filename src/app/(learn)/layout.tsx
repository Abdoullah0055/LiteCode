import {requireUser,accountData} from '@/lib/data';
export const dynamic='force-dynamic';
export default async function LearnLayout({children}:{children:React.ReactNode}){await requireUser();const account=await accountData();return <div className={`app-shell ${account.settings.dark_mode?'dark-app':''}`}><main>{children}</main></div>;}
