import{useState}from'react';
import{formatTime}from'./subtitles';
import{parseSkipTime,skipRangeError,type SkipSettings}from'./skipRanges';
export default function SkipRanges({settings,onChange,duration,time,ready,name}:{settings:SkipSettings;onChange:(value:SkipSettings)=>void;duration:number;time:number;ready:boolean;name:string}){
 const [start,setStart]=useState(''),[end,setEnd]=useState(''),[editing,setEditing]=useState<string|null>(null),[error,setError]=useState('');
 const cancel=()=>{setEditing(null);setStart('');setEnd('');setError('');};
 const submit=()=>{const from=parseSkipTime(start),to=parseSkipTime(end),message=skipRangeError(from,to,duration);if(message){setError(message);return;}
  const range={id:editing??(crypto.randomUUID?.()??Date.now().toString(36)+Math.random().toString(36).slice(2)),start:from!,end:to!,enabled:editing?settings.ranges.find(r=>r.id===editing)?.enabled!==false:true};
  onChange({...settings,ranges:[...settings.ranges.filter(r=>r.id!==range.id),range].sort((a,b)=>a.start-b.start)});cancel();
 };
 return <div className="modal-body skip-ranges"><p className="skip-file" title={name}>{name}</p><p>Jump over unwanted parts automatically. Times refer to the original video.</p>
 <fieldset disabled={!ready}><label className="check"><input type="checkbox" checked={settings.enabled} onChange={e=>onChange({...settings,enabled:e.target.checked})}/> Enable automatic skipping</label>
 <form onSubmit={e=>{e.preventDefault();submit();}}><div className="skip-inputs"><label>From<input aria-label="Skip from" placeholder="0:20:10" value={start} onChange={e=>{setStart(e.target.value);setError('');}}/><button type="button" onClick={()=>setStart(formatTime(time))}>Use current time</button></label><span aria-hidden="true">→</span><label>To<input aria-label="Skip to" placeholder="0:22:15" value={end} onChange={e=>{setEnd(e.target.value);setError('');}}/><button type="button" onClick={()=>setEnd(formatTime(time))}>Use current time</button></label></div>
 <p className="hint">hh:mm:ss · mm:ss · seconds{duration>0?' · Video length '+formatTime(duration):''}</p>{error&&<p className="warning" role="alert">{error}</p>}<div className="row"><button className="primary" type="submit">{editing?'Save range':'Add range'}</button>{editing&&<button type="button" onClick={cancel}>Cancel edit</button>}</div></form>
 <div className="skip-list">{!settings.ranges.length?<p className="hint">No skip ranges yet. Add as many as you need.</p>:settings.ranges.map((r,i)=><div className="skip-range" key={r.id}><label className="check"><input type="checkbox" aria-label={'Enable skip range '+(i+1)} checked={r.enabled} onChange={e=>onChange({...settings,ranges:settings.ranges.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x)})}/><span>{formatTime(r.start)} → {formatTime(r.end)}</span></label><button aria-label={'Edit skip range '+(i+1)} onClick={()=>{setEditing(r.id);setStart(String(r.start));setEnd(String(r.end));setError('');}}>Edit</button><button aria-label={'Remove skip range '+(i+1)} onClick={()=>{onChange({...settings,ranges:settings.ranges.filter(x=>x.id!==r.id)});if(editing===r.id)cancel();}}>Remove</button></div>)}</div>
 </fieldset><p className="hint">Saved on this device for this video. Reopen the same file to use these ranges again. Turn skipping off to watch or inspect excluded parts. Overlapping ranges are skipped together.</p></div>;
}
