//! Experimental macOS mpv controller. Video opens in mpv's own window.
//! No shell invocation; private per-process Unix socket; command allowlist.
use std::{io::{BufRead,BufReader,Write},os::unix::net::UnixStream,path::Path,process::{Child,Command,Stdio},sync::Mutex,time::Duration};
use serde_json::{json,Value};
struct Session { child:Child, dir:tempfile::TempDir }
impl Drop for Session {fn drop(&mut self){let _=self.child.kill();let _=self.child.wait();}}
#[derive(Default)] struct Player(Mutex<Option<Session>>);
#[tauri::command]
fn native_open(path:String,state:tauri::State<Player>)->Result<(),String>{
 if !Path::new(&path).is_file(){return Err("Select a local media file".into());}
 let executable=["/opt/homebrew/bin/mpv","/usr/local/bin/mpv","/usr/bin/mpv"].into_iter().find(|p|Path::new(p).is_file()).ok_or("Install mpv separately (brew install mpv)")?;
 let mut guard=state.0.lock().map_err(|e|e.to_string())?;*guard=None;
 let dir=tempfile::Builder::new().prefix("yellow-player-").tempdir().map_err(|e|e.to_string())?;let socket=dir.path().join("mpv.sock");
 let child=Command::new(executable).args(["--no-config","--idle=yes","--keep-open=yes","--hwdec=auto-safe","--title=Yellow Player — Native video","--input-default-bindings=yes"]).arg(format!("--input-ipc-server={}",socket.display())).arg("--").arg(path).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e|e.to_string())?;
 let mut session=Session{child,dir};
 for _ in 0..60 {if socket.exists(){*guard=Some(session);return Ok(());}if session.child.try_wait().map_err(|e|e.to_string())?.is_some(){return Err("mpv exited before IPC was ready".into());}std::thread::sleep(Duration::from_millis(50));}
 Err("mpv startup timed out".into())
}
fn send(session:&Session,command:Value)->Result<Value,String>{
 let mut socket=UnixStream::connect(session.dir.path().join("mpv.sock")).map_err(|e|e.to_string())?;socket.set_read_timeout(Some(Duration::from_secs(2))).map_err(|e|e.to_string())?;socket.set_write_timeout(Some(Duration::from_secs(2))).map_err(|e|e.to_string())?;
 writeln!(socket,"{}",json!({"command":command,"request_id":1})).map_err(|e|e.to_string())?;let mut reader=BufReader::new(socket);
 for _ in 0..100 {let mut line=String::new();reader.read_line(&mut line).map_err(|e|e.to_string())?;let result:Value=serde_json::from_str(&line).map_err(|e|e.to_string())?;if result["request_id"]==1 {if result["error"]!="success"{return Err(result["error"].to_string());}return Ok(result["data"].clone());}}
 Err("No IPC response".into())
}
#[tauri::command]
fn native_command(action:String,value:Option<Value>,state:tauri::State<Player>)->Result<Value,String>{
 let guard=state.0.lock().map_err(|e|e.to_string())?;let session=guard.as_ref().ok_or("Open a native video first")?;let val=value.unwrap_or(Value::Null);
 let command=match action.as_str(){
  "pause"=>json!(["cycle","pause"]),"stop"=>json!(["stop"]),"fullscreen"=>json!(["cycle","fullscreen"]),
  "seek"=>json!(["seek",val.as_f64().ok_or("Invalid seek")?,"absolute+exact"]),
  "speed"=>json!(["set_property","speed",val.as_f64().ok_or("Invalid speed")?.clamp(0.25,4.0)]),
  "volume"=>json!(["set_property","volume",val.as_f64().ok_or("Invalid volume")?.clamp(0.0,100.0)]),
  "sub-delay"=>json!(["set_property","sub-delay",val.as_f64().ok_or("Invalid subtitle delay")?.clamp(-3600.0,3600.0)]),
  "sub-font-size"=>json!(["set_property","sub-font-size",val.as_f64().ok_or("Invalid size")?.clamp(8.0,120.0)]),
  "sub-font"=>json!(["set_property","sub-font",val.as_str().ok_or("Invalid font")?]),
  "subtitle"=>{let path=val.as_str().ok_or("Invalid subtitle path")?;if !Path::new(path).is_file(){return Err("Subtitle file missing".into());}json!(["sub-add",path,"select"])},
  "audio-next"=>json!(["cycle","aid"]),"subtitle-next"=>json!(["cycle","sid"]),
  "position"=>json!(["get_property","time-pos"]),"duration"=>json!(["get_property","duration"]),"tracks"=>json!(["get_property","track-list"]),
  _=>return Err("Unsupported native command".into())};send(session,command)
}
fn main(){tauri::Builder::default().plugin(tauri_plugin_dialog::init()).manage(Player::default()).invoke_handler(tauri::generate_handler![native_open,native_command]).run(tauri::generate_context!()).expect("Yellow Player runtime failed");}
