import { MusicInfo } from "../Types/MusicInfo";
import { AUserInterface } from "./AUserInterface";
import io, {Socket} from "socket.io-client"
import express, {Application, Request, Response} from "express"
import path from "path";

export class WebUIModule extends AUserInterface{
  _port: number;
  _socket: Socket;
  _app: Application;

  constructor(webPort:number){
    super();
    this._port = webPort;
    this._socket = io(`http:\\localhost:${webPort+1}`,{transports:['websocket']});
    this._app = express()
    this._app.set('view engine','ejs')
    this._app.set('views',path.join(process.cwd(), 'templates'))
    this._app.listen(webPort,()=>{
      console.log('Web server and socket are up and running at port', webPort, 'and', webPort+1)
    })

    this._socket.on('db-get',()=>{
      this.invoke('db-get', null as never, null as never)
    })
  }

  sendString(str: string): void {
    this._socket.emit('str',str)
    return;
  }
  sendMusic(music: MusicInfo): void {
    this._socket.emit('music',music)
    return;
  }

}