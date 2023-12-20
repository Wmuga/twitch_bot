import { MusicInfo } from "../Types/MusicInfo";


export interface IOverlayServer{
  sendSong(song:MusicInfo|undefined):void;
  sendViewer(name:string):void;
  sendChat(size:string):void;
}