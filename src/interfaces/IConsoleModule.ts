import {SendEventHandler, SendSelfEventHandler, DBUpdateEventHandler, DBGetEventHandler, ResizeEventHandler} from '../Types/ConsoleEventHandlers'

export interface IConsoleModule{
  setSelfChannel(channel:string):void;
  on(event:'send',callback:SendEventHandler):void;
  on(event:'send-self',callback:SendSelfEventHandler):void;
  on(event:'db-update',callback:DBUpdateEventHandler):void;
  on(event:'db-get',callback:DBGetEventHandler):void;
  on(event:'resize',callback:ResizeEventHandler):void;
}