export type Case = {
  label: string;
  args: unknown[];
  expected: unknown;
  preserve_inputs?: boolean;
  require_new_array?: boolean;
};
export function evaluate(
  code: string,
  cases: Case[],
): Promise<
  { label: string; passed: boolean; actual?: unknown; error?: string }[]
>;
