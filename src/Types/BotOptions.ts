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
  youtube?:{
    api_key:string
  }
}