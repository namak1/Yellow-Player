declare module 'libass-wasm' {
 export default class SubtitlesOctopus {
 constructor(options:Record<string,unknown>);
 setCurrentTime(time:number):void;
 resize(width:number,height:number,top?:number,left?:number):void;
 dispose():void;
 }
}
