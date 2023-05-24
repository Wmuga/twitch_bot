import { SendEventHandler, SendSelfEventHandler, DBUpdateEventHandler, DBGetEventHandler, ResizeEventHandler, ConsoleEvent, ConsoleEventHandler } from "../Types/ConsoleEventHandlers";
import { MusicInfo } from "../Types/MusicInfo";
import { AUserInterface } from "./AUserInterface";

export class WebUIModule extends AUserInterface{

  constructor(){
    super();
  }

  sendString(str: string): void {
    return;
    throw new Error("Method not implemented.");
  }
  sendMusic(music: MusicInfo): void {
    return;
    throw new Error("Method not implemented.");
  }

}