import { MusicInfo } from "../Types/MusicInfo";
import { IMusicProvider } from "../interfaces/IMusicProvider";

export class ExtPlayerFile implements IMusicProvider{
  constructor(filename:string){

  }

  isReady(): boolean {
    return true;
  }
  isPlaying(): boolean {
    throw new Error("Method not implemented.");
  }
  play(): void {
    return;
  }
  stop(): void {
    return;
  }
  skip(): void {
    return;
  }
  add(username: string, isMod: boolean, search_data: string): Promise<[boolean, string]> {
    return new Promise(resolve=>{
      resolve([false, "Not supported"])
    });
  }
  changeVolume(volume: number): void {
    return;
  }
  current(): MusicInfo | undefined {
    throw new Error("Method not implemented.");
  }
  
}