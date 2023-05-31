import {SendEventHandler, SendSelfEventHandler, DBUpdateEventHandler, DBGetEventHandler, ResizeEventHandler, ChatCommandEventHandler} from '../Types/ConsoleEventHandlers'
import { MusicInfo } from '../Types/MusicInfo';

export interface IUserInterface{
  setSelfChannel(channel:string):void;
  on(event:'send',callback:SendEventHandler):void;
  on(event:'send-self',callback:SendSelfEventHandler):void;
  on(event:'db-update',callback:DBUpdateEventHandler):void;
  on(event:'db-get',callback:DBGetEventHandler):void;
  on(event:'resize',callback:ResizeEventHandler):void;
  on(event: "command", callback: ChatCommandEventHandler): void;
  sendString(str:string):void;
  sendMusic(music:MusicInfo | undefined):void;
}