export type BotOptions = {
  identity:{
    name:string;
    oauth:string;
  }
  
  channel:string;

  uiPort:number;
  overlayPort:number;

  youtube?:YoutubeOptions;

  ipc_pipe_name?:string;

  announces?:Array<string>;
}

export type YoutubeOptions = {
  api_key:string;
  restrictions?:{
    user?:number;
    mod?:number;
  };
  time_limit?:number;
  standart_volume?:number;
}