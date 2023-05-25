import { Client, ChatUserstate } from "tmi.js"
import { IBot } from "../interfaces/IBot"
import { BotOptions } from "../Types/BotOptions";
import { IMusicProvider } from "../interfaces/IMusicProvider";
import { IUserInterface } from "../interfaces/IUserInterface";
import { Container } from "./DIContainer";
import { IDatabaseModule } from "../interfaces/IDatabaseModule";
import { MusicInfo } from "../Types/MusicInfo";

export class Bot implements IBot{
  private _client:Client;
  private _joined_channel: string;
  
  private _viewers: Set<string> = new Set<string>();
  private _viewers_chatted: Set<string> = new Set<string>();
  
  private _messages_count: number = 0;
  private _announces_count: number = 0;
  private _enabled_requests:boolean = false;

  private _botRegex:RegExp | undefined;

  private _ownMusic?: IMusicProvider;
  private _ytMusic?: IMusicProvider = Container.get('yt');
  private _lastMusic?: MusicInfo;
  
  private _dbModule?: IDatabaseModule = Container.get('database');
  private _uis?: Array<IUserInterface> = Container.get('uiar');

  private _sendMus: NodeJS.Timer;

  constructor(options:BotOptions){
    this._client = new Client({
      options:{
        debug:false
      },
      connection:{
        reconnect:true
      },
      identity:{
        username: options.identity.name,
        password: options.identity.oauth,
      },
      channels: [options.channel]
    });

    this._joined_channel = options.channel;

    this.setupRegexp();

    this._client.on('connected',()=>{
      console.log(`Connected to ${options.channel}`);
    })

    this._client.on('join', (_,username)=>this.onUserJoin(username));
    this._client.on('part', (_,username)=>this.onUserPart(username));
    this._client.addListener('message',(channel,userstate,message,self)=>this.handleMessage(channel,userstate,message,self));

    this._client.connect();

    for(let ui of this._uis??[]){
      ui.on('send',(channel, message)=>{
        this.sayToChannel(channel, message);
      });
  
      ui.on('send-self',(message)=>{
        this.say(message);
      });
  
      ui.on('db-get',()=>{
        var points = this._dbModule?.getPointsMax20();
        if (!points){
          ui.sendString('{}');
          return; 
        }
        for(let k in points){
          ui.sendString(`${k}: ${points[k]}`);
        }
      });
  
      ui.on('db-update',(username, points)=>{
        this._dbModule?.setPointsViewer(username, points)
      })
    }

    this._sendMus = setInterval(()=>{
      this.checkPlayingMusic();
    }, 1000)
    
  }

  say(message: string):void{
    this._client.say(this._joined_channel,message);
  }

  sayToChannel(channel: string, message: string): void {
    if (!channel.startsWith('#')) channel = `#${channel}`;
    this._client.join(channel).then(()=>{
      this._client.say(channel,message);
      this._client.part(channel);
    });
  }

  reply(username: string, message: string):void{
    this.say(`@${username}, ${message}`);
  }

  private onUserJoin(username:string){
    this._viewers.add(username);
  }

  private onUserPart(username:string){
    this._viewers.delete(username);
  }

  private isViewerFirstChat(username: string):boolean{
    if (username ==  this._joined_channel) return false;
    if(!this._viewers_chatted.has(username)){
      this._viewers_chatted.add(username);
      return true;
    }
    return false;
  }

  private setupRegexp(){
    let services = [
      'streamdetails',
      'getviewers',
      'bigfollows',
      'yourfollows',
      'crazycash',
      'twitch_viewers',
      'streamskill',
      'kutt.it/zqZNce',
      'smsc.sc/?2l0t0ew'
    ];

    let repeatedLetters = ['eе', 'tт', 'yу', 'oо0', 'pp','aа', 'hн', 'kк', 'xх', 'cс', 'bв', 'mм', 'rг'];
    services = services.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')));
    this._botRegex = new RegExp(services.join('|'), 'ig');
  }

  private isBotMessage(username:string, message:string):boolean{
    if (this._botRegex!.test(message)) 
    {
      console.log(`Пойман долбучий бот ${username}`);
      this._client.ban(this._joined_channel,username,'спамобот');
      return true;
    }
    return false;
  }

  private handleMessage(channel:string, userstate: ChatUserstate, message: string, self: boolean):void{
    if (self) return;
    
    let username:string = userstate.username??"";
    
    if (this.isBotMessage(username,message)) return;
    if (this.isViewerFirstChat(username)){
      this.say(`Приветствую, @${username}`);
    }

    this._messages_count++;
    if(this._messages_count == 5){
      this._messages_count = 0;
      this.announce();
    }

    if (message[0]=='!') 
      this.handleCommands(userstate,message.toLowerCase().split(' '))
  }

  private havePermissions(userstate: ChatUserstate, isOwnerOnly: boolean):boolean{
    return (!isOwnerOnly && userstate["mod"]) || `#${userstate['username']}` == this._joined_channel;
  }

  private handleCommands(userstate: ChatUserstate, commands: string[]):void{
    let username:string = userstate['display-name']??"";
    commands[0] = commands[0].substring(1);
    commands = commands.filter(e=>e.length>0);
    switch(commands[0]){
      case 'help':
        this.reply(username, 'помощь была утеряна');
        return;
      // Звуки
      case 'sound':
      case 's':
        this.reply(username, 'модуль звуков утерян');
        return;
      // Модуль музяки
      case 'sr-start':
        if (this._enabled_requests) return;
        if(!this.havePermissions(userstate,true)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this._enabled_requests = true;
        this._ytMusic?.play();
        this.say('Включены запросы');
        return;
      case 'sr-stop':
      case 'sr-close':
      case 'sr-end':
        if (!this._enabled_requests) return;
        
        if(!this.havePermissions(userstate,true)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this._enabled_requests = false;
        this._ytMusic?.stop();
        this.say('Выключены запросы');
        return;
      case 'sr':
        if(!this._enabled_requests){
          this.reply(username, 'заказы не включены');
          return;
        }
        if (commands.length == 1){
          this.reply(username, 'Можно заказать музыку !sr *трек*');
          return;
        }

        if (!(this._dbModule?.tryRemovePoints(username,5)??true)){
          this.reply(username, 'Недостаточно поинтов. Нужно 5');
          return;
        }

        this._ytMusic?.add(username, userstate.mod??false, commands.slice(1).join(' ')).then(v=>{
          this.say(v[1]);
        });
        return;
      case 'sr-skip':
        if(!this.havePermissions(userstate,false)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this._ytMusic?.skip();
        return;
      case 'sr-volume':
        if(!this.havePermissions(userstate,false)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        if (commands.length == 1 || !Number(commands[1])) return;

        this._ytMusic?.changeVolume(Number(commands[1]))
        return;
      // Модуль БД
      case 'points':
        let points = this._dbModule?.getPointsViewer(username)??0;
        this.reply(username, `У тебя ${points} поинтов`);
        return;
      case 'roulette':
        this.say('А реализовывать кто будет?');
        return;
      // Остальное
      case 'roll':
        if(commands.length==1){
          this.reply(username,'!roll *кол-во кубов*d*макс значение куба*')
          return;
        }
        let data = commands[1].split('d');
        let count = Number(data[0]) || 1;
        let max = data.length > 1 
          ? (Number(data[1]) || 6) 
          : 6;
        let cubes = new Array<Number>(count)
          .fill(0)
          .map(_=>Math.floor(Math.random()*max)+1);
        this.reply(username,`${cubes.join(' + ')} = ${cubes.reduce((a,b)=>a+b,0)}`)
        return;
      default:
        this.reply(username,'нет такой команды');
        return;
    }
  }

  private announce():void{
    // announce messages
    return;
  }


  private checkPlayingMusic(){
    if (!this._ownMusic?.isPlaying() && !this._ytMusic?.isPlaying()) return;

    let curMusic = this._ytMusic?.isPlaying() ? this._ytMusic : this._ownMusic;

    let cur = curMusic?.current();
    if (cur == this._lastMusic) return;

    this._lastMusic = cur;
    
    for(let ui of this._uis??[]){
      ui.sendMusic(cur!);
    }
  }
}