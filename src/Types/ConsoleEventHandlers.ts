export type SendEventHandler = (channel:string, message:string)=>void;
export type SendSelfEventHandler = (message:string)=>void;
export type DBUpdateEventHandler = (username:string, points:number)=>void;
export type DBGetEventHandler = ()=>void;
export type ResizeEventHandler = (small:boolean)=>void;

export type ConsoleEventHandler = 
  SendEventHandler | SendSelfEventHandler | 
  DBUpdateEventHandler | DBGetEventHandler | 
  ResizeEventHandler

export type ConsoleEvent = 
  'send' | 'send-self' | 'db-update' | 'db-get' | 'resize'