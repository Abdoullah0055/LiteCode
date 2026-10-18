import {parentPort,workerData} from 'node:worker_threads';
import {evaluate} from './evaluate.mjs';
try {parentPort.postMessage({results:await evaluate(workerData.code,workerData.cases)});}
catch {parentPort.postMessage({error:'Évaluation impossible.'});}
