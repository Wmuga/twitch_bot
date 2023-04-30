export type BotOptions = {
  identity:{
    name:string;
    oauth:string;
  }
  
  channel:string;

  spotify?:{
    client_id:string;
    client_secret:string;
    device_id:string;
  };
  youtube?:YoutubeOptions;
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