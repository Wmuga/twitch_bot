import { SendEventHandler, SendSelfEventHandler, DBUpdateEventHandler, DBGetEventHandler, ResizeEventHandler, ConsoleEvent, ConsoleEventHandler } from "../Types/ConsoleEventHandlers";
import { MusicInfo } from "../Types/MusicInfo";
import { IUserInterface } from "../interfaces/IUserInterface";

export abstract class AUserInterface implements IUserInterface{

  protected _handlers:Record<ConsoleEvent, ConsoleEventHandler | undefined> = {
    'send': undefined,
    'send-self': undefined,
    'db-update': undefined,
    'db-get': undefined,
    'resize': undefined
  };

  protected _self_channel?: string;
  
  setSelfChannel(channel: string): void{
    this._self_channel = channel;
  }

  on(event: "send", callback: SendEventHandler): void;
  on(event: "send-self", callback: SendSelfEventHandler): void;
  on(event: "db-update", callback: DBUpdateEventHandler): void;
  on(event: "db-get", callback: DBGetEventHandler): void;
  on(event: "resize", callback: ResizeEventHandler): void;
  on(event: ConsoleEvent, callback: ConsoleEventHandler): void {
    this._handlers[event] = callback;
  }
  abstract sendString(str: string): void;
  abstract sendMusic(music: MusicInfo): void;
  
}