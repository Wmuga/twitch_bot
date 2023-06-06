import { MusicInfo } from "../Types/MusicInfo";
import { IMusicProvider } from "../interfaces/IMusicProvider"
import { connect, Socket } from "net";

export class IPCMusic implements IMusicProvider{
  _connected = false;
  _meta: MusicInfo | undefined;
  _pipe: Socket | undefined;
  _pipeName:string;
  _interval: NodeJS.Timer | undefined;

  constructor(pipeName:string){
    this._pipeName = "\\\\.\\pipe\\" + pipeName;
    this.setConnectionInterval();
  }
  
  isReady(): boolean {
    return this._connected;
  }
  
  isPlaying(): boolean {
    return this.isReady() && this._meta != undefined;
  }
  
  play(): void {
    if (this._meta != undefined){
      this.sendPlayPause();
    }
  }

  stop(): void {
    if (this.isPlaying()){
      this.sendPlayPause();
    }
  }

  skip(): void {
    this.sendNext();
  }

  add(username: string, isMod: boolean, search_data: string): Promise<[boolean, string]> {
    return new Promise(resolve=>{
      resolve([false, "Невозможное действие"]);
    })
  }

  changeVolume(volume: number): void {
    this.sendVolume(volume);
  }

  current(): MusicInfo | undefined {
    return this._meta;
  }

  private sendPlayPause(){
    this.sendCommand("PlayPause");
  }

  private sendNext(){
    this.sendCommand("Next");
  }

  private sendVolume(volume:number){
    if (volume < 1 && volume > 0){
      this.sendCommand(`Volume ${volume}`)
    }
  }

  private sendCommand(command:string){
    if (this._connected){
      this._pipe?.write(command + "\r\n");
    }
  }

  private tryConnect(){
    let ipcSocket = connect(this._pipeName,()=>{
      this._connected = true;

      console.log('Найдено соединение с IPC');

      ipcSocket.on('data', this.handleData.bind(this));
      ipcSocket.on('close',this.setConnectionInterval.bind(this));

      this._pipe = ipcSocket;

      clearInterval(this._interval);
    })
    // Если не подключился - грустно
    ipcSocket.on('error',()=>{});
  }

  private handleData(data:Buffer){
    const dataArray = data.filter(e=>e!=0).toString().trim().split(';;');
    
    if (dataArray.length < 3) return;
    if (dataArray[0].length == 0) {
      this._meta = undefined;
      return;
    }


    this._meta = {
      id:"None",
      track: dataArray[1],
      album: dataArray[2],
      artist: dataArray[0],
      username: "IPCMusic"
    };
  }

  private setConnectionInterval(){
    this._pipe = undefined;
    this._connected = false;
    this._interval = setInterval(this.tryConnect.bind(this), 30_000);
  }

}