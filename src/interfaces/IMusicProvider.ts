import { MusicInfo } from "../Types/MusicInfo";

export interface IMusicProvider{
  isReady():boolean;
  isPlaying():boolean;

  play():void;
  stop():void;
  skip():void;
  add(username:string,isMod:boolean,search_data:string):Promise<[boolean, string]>;
  changeVolume(volume:number):void;

  current():MusicInfo | undefined;
}