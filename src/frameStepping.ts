import{Input,BlobSource,ALL_FORMATS,EncodedPacketSink}from'mediabunny';
/** Packet timestamps preserve fractional and variable frame cadence. Payloads are never decoded here. */
export class FrameStepper{
 private input:Input;private sink:Promise<EncodedPacketSink|null>;
 constructor(file:Blob){this.input=new Input({source:new BlobSource(file),formats:ALL_FORMATS});this.sink=this.input.getPrimaryVideoTrack().then(t=>t?new EncodedPacketSink(t):null).catch(()=>null);}
 async target(time:number,direction:-1|1){const sink=await this.sink;if(!sink)throw Error('This file has no readable video frame timestamps.');const opts={metadataOnly:true};const current=await sink.getPacket(time+.000001,opts);if(!current)return (await sink.getFirstPacket(opts))?.timestamp||0;
 if(direction<0)return (await sink.getPacket(Math.max(0,current.timestamp-.000001),opts))?.timestamp||0;
 // Decode order can differ from display order (B frames). Search by presentation timestamp.
 let low=current.timestamp,high=low+.001,next=await sink.getPacket(high,opts);
 for(let i=0;i<14&&(!next||next.timestamp<=current.timestamp);i++){high=current.timestamp+(high-current.timestamp)*2;next=await sink.getPacket(high,opts);}
 if(!next||next.timestamp<=current.timestamp)return current.timestamp;
 for(let i=0;i<24;i++){const mid=(low+high)/2;const p=await sink.getPacket(mid,opts);if(p&&p.timestamp>current.timestamp)high=mid;else low=mid;}
 return (await sink.getPacket(high,opts))!.timestamp;
 }
 dispose(){this.input.dispose();}
}
