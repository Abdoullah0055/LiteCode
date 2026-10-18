export type Case={label:string;args:unknown[];expected:unknown};
export function evaluate(code:string,cases:Case[]):Promise<{label:string;passed:boolean;actual?:unknown;error?:string}[]>;
