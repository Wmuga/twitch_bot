import { MusicInfo } from "../Types/MusicInfo";

export interface IMusicProvider{
  isReady:()=>boolean;
  isPlaying:()=>boolean;

  start:()=>void;
  stop:()=>void;

  current:()=>MusicInfo;
}