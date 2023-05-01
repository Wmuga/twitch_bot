export interface IBot{
  say (message:string):void;
  sayToChannel(channel:string, message:string):void;
  reply (username:string, message:string):void;
}