/** Decoder workers are bundled locally; no movie bytes leave the device. */
const loading=new Map<string,Promise<void>>();
export function needsSoftwareAudio(codec:string|null){return codec==='ac3'||codec==='eac3'||codec==='dts';}
export async function ensureAudioDecoder(codec:string|null){
 if(!needsSoftwareAudio(codec))return;
 const family=codec==='dts'?'dts':'ac3';let promise=loading.get(family);
 if(!promise){promise=family==='ac3'?import('@mediabunny/ac3').then(m=>m.registerAc3Decoder()):import('@mediabunny/dts').then(m=>m.registerDtsDecoder());loading.set(family,promise);}
 try{await promise;}catch(e){loading.delete(family);throw Error(`Could not load the ${codec?.toUpperCase()} software decoder. ${String(e)}`);}
}
