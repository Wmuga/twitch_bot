import { MusicInfo } from "../Types/MusicInfo";
import { AUserInterface } from "./AUserInterface";
import {Server} from "socket.io"
import express, {Application, Request, Response} from "express"
import http  from 'http'
import path from "path";

export class WebUIModule extends AUserInterface{
  private _port: number;
  private _socket: Server;
  private _http: http.Server;
  private _app: Application;
  private _music: MusicInfo = {
    id: ""
  };

  constructor(webPort:number){
    super();

    this._port = webPort;
    this._app = express();
    this._http = http.createServer(this._app);
    this._socket = new Server(this._http);

    this._app.set('view engine','ejs')
    this._app.set('views',path.join(process.cwd(), 'templates'))

    this._app.use(express.static(path.join(process.cwd(),'public')))
    this._app.get('/',(_,res)=>{
      
      res.render('index',{
        data:{
          'music':this._music,
        }
      });

    });
    this._socket.on('connection',(socket)=>{

      socket.on('db-get',()=>{
        this.invoke('db-get', null as never, null as never);
      });
    
      socket.on('db-update',(username:string, points:number)=>{
        this.invoke('db-update', username, points);
      });
    
      socket.on('send',(channel:string, message:string)=>{
        if (channel == this._self_channel){
          this.invoke('send-self', message, null as never);
          return;
        }
        this.invoke('send', channel, message);
      });
    
      socket.on('send-self',(message:string)=>{
        this.invoke('send-self', message, null as never);
      });
    
      socket.on('resize',(small:boolean)=>{
        this.invoke('resize', small, null as never)
      })
    
      socket.on('command',(command:string)=>{
        this.invoke('command', command, null as never);
      });
      
      console.log('connection');
    });

    this._http.listen(webPort,()=>{
      console.log('Web server and socket are up and running at port', webPort);
    });
  }

  sendString(str: string): void {
    this._socket.emit('str',str)
    return;
  }

  sendMusic(music: MusicInfo | undefined): void {
    this._music = music ?? {id:""};
    this._socket.emit('music', music)
    return;
  }

}