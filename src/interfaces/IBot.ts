export interface IBot{
  say (message:string):void;
  reply (username:string, message:string):void;
}