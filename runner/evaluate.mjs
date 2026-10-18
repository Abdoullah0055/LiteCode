import { getQuickJS } from "quickjs-emscripten";
import { isDeepStrictEqual } from "node:util";

/** No Node/DOM/fs/network bindings are installed in the learner VM. */
export async function evaluate(code, cases) {
  const QuickJS = await getQuickJS();
  return cases.map((test) => {
    const runtime = QuickJS.newRuntime();
    runtime.setMemoryLimit(16 * 1024 * 1024);
    runtime.setMaxStackSize(256 * 1024);
    const deadline = Date.now() + 200;
    runtime.setInterruptHandler(() => Date.now() > deadline);
    const vm = runtime.newContext();
    let result;
    try {
      result = vm.evalCode(
        `'use strict';\n${code}\n;(()=>{const __lcArgs=${JSON.stringify(test.args)};const __lcValue=solve(...__lcArgs);return {value:__lcValue,args:__lcArgs,sameArray:__lcValue===__lcArgs[0]};})()`,
      );
      if (result.error) {
        const error = vm.dump(result.error);
        return {
          label: test.label,
          passed: false,
          error: String(error?.message || "Erreur JavaScript").slice(0, 500),
        };
      }
      const execution = vm.dump(result.value);
      const value = execution.value;
      const size = JSON.stringify(value)?.length || 0;
      if (size > 16000)
        return {
          label: test.label,
          passed: false,
          error: "Résultat trop volumineux (16 Ko maximum).",
        };
      if (test.preserve_inputs && !isDeepStrictEqual(execution.args, test.args))
        return {
          label: test.label,
          passed: false,
          error: "Le tableau d’entrée a été modifié. Retourne une copie.",
        };
      if (test.require_new_array && execution.sameArray)
        return {
          label: test.label,
          passed: false,
          error: "Retourne un nouveau tableau, pas la référence reçue.",
        };
      return {
        label: test.label,
        passed: isDeepStrictEqual(value, test.expected),
        actual: value ?? null,
      };
    } catch {
      return {
        label: test.label,
        passed: false,
        error: "Limite de mémoire ou résultat non sérialisable.",
      };
    } finally {
      result?.error?.dispose();
      result?.value?.dispose();
      vm.dispose();
      runtime.dispose();
    }
  });
}
