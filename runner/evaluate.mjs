import { getQuickJS } from 'quickjs-emscripten';
import { isDeepStrictEqual } from 'node:util';

/** No Node/DOM/fs/network bindings are installed in the learner VM. */
export async function evaluate(code, cases) {
  const QuickJS = await getQuickJS();
  return cases.map(test => {
    const runtime=QuickJS.newRuntime();
    runtime.setMemoryLimit(16 * 1024 * 1024);
    runtime.setMaxStackSize(256 * 1024);
    const deadline=Date.now()+200;
    runtime.setInterruptHandler(()=>Date.now()>deadline);
    const vm=runtime.newContext();
    let result;
    try {
      result=vm.evalCode(`'use strict';\n${code}\n;solve(...${JSON.stringify(test.args)})`);
      if(result.error) {
        const error=vm.dump(result.error);
        return {label:test.label,passed:false,error:String(error?.message||'Erreur JavaScript').slice(0,500)};
      }
      const value=vm.dump(result.value);
      const size=JSON.stringify(value)?.length||0;
      if(size>16000) return {label:test.label,passed:false,error:'Résultat trop volumineux (16 Ko maximum).'};
      return {label:test.label,passed:isDeepStrictEqual(value,test.expected),actual:value??null};
    } catch {
      return {label:test.label,passed:false,error:'Limite de mémoire ou résultat non sérialisable.'};
    } finally {
      result?.error?.dispose(); result?.value?.dispose(); vm.dispose(); runtime.dispose();
    }
  });
}
