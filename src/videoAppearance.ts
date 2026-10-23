export const colorProfiles={Original:{brightness:100,contrast:100,saturation:100,hue:0},Vivid:{brightness:100,contrast:106,saturation:115,hue:0}};
export type VideoColors={brightness:number;contrast:number;saturation:number;hue:number};
export const videoDefaults={...colorProfiles.Vivid,rotation:0,flip:false,zoom:100,fit:'contain'};
export function videoFilter(colors:VideoColors){if(colors.brightness===100&&colors.contrast===100&&colors.saturation===100&&colors.hue===0)return 'none';return `brightness(${colors.brightness}%) contrast(${colors.contrast}%) saturate(${colors.saturation}%) hue-rotate(${colors.hue}deg)`;}
export function colorProfile(colors:VideoColors){return Object.entries(colorProfiles).find(([,p])=>Object.entries(p).every(([k,v])=>colors[k as keyof VideoColors]===v))?.[0]||'Custom';}
