import tmi,{Client, ChatUserstate} from "tmi.js"
import { IBot } from "../interfaces/IBot"
import { BotOptions } from "../Types/BotOptions";
import { channel } from "diagnostics_channel";

export class Bot implements IBot{
  private client:Client;
  private joined_channel: string
  
  private viewers: Set<string>
  private viewers_chatted: Set<string>
  
  private messages_count: number
  private announces_count: number
  
  private enabled_requests:boolean;

  private botRegex:RegExp | undefined;

  constructor(options:BotOptions){
    this.client = new Client({
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
    this.joined_channel = options.channel;

    this.viewers = new Set<string>();
    this.viewers_chatted = new Set<string>();
    this.messages_count = 0;
    this.announces_count = 0;
    this.enabled_requests = false;
    this.setupRegexp();

    this.client.on('connected',()=>{
      console.log(`Connected to ${options.channel}`);
    })

    this.client.on('join', (_,username)=>this.onUserJoin(username));
    this.client.on('part', (_,username)=>this.onUserPart(username));
    this.client.addListener('message',(channel,userstate,message,self)=>this.handleMessage(channel,userstate,message,self));

    this.client.connect();
  }

  say(message: string):void{
    this.client.say(this.joined_channel,message);
  }

  reply(username: string, message: string):void{
    this.say(`@${username}, ${message}`);
  }

  private onUserJoin(username:string){
    this.viewers.add(username);
  }

  private onUserPart(username:string){
    this.viewers.delete(username);
  }

  private isViewerFirstChat(username: string):boolean{
    if(!this.viewers_chatted.has(username)){
      this.viewers_chatted.add(username);
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
    this.botRegex = new RegExp(services.join('|'), 'ig');
  }

  private isBotMessage(username:string, message:string):boolean{
    if (this.botRegex!.test(message)) 
    {
      console.log(username + " нарвался на бананду за спам");
      this.client.ban(this.joined_channel,username,'спам');
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

    this.messages_count++;
    if(this.messages_count == 5){
      this.messages_count = 0;
      this.announce();
    }

    if (message[0]=='!') 
      this.handleCommands(userstate,message.toLowerCase().split(' '))
  }

  private haveRights(userstate: ChatUserstate, isOwnerOnly: boolean):boolean{
    return false;
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
        if(!this.haveRights(userstate,true)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this.enabled_requests = true;
        this.say('А реализовывать кто будет?');
        return;
      case 'sr-stop':
      case 'sr-close':
      case 'sr-end':
        if(!this.haveRights(userstate,true)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this.enabled_requests = true;
        this.say('А реализовывать кто будет?');
        return;
      case 'sr':
        this.say('А реализовывать кто будет?');
        return;
      case 'sr-skip':
        if(!this.haveRights(userstate,false)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this.enabled_requests = true;
        this.say('А реализовывать кто будет?');
        return;
      case 'sr-volume':
        if(!this.haveRights(userstate,false)){
          this.reply(username, 'не трожь кнопку');
          return;
        }
        this.enabled_requests = true;
        this.say('А реализовывать кто будет?');
        return;
      // Модуль БД
      case 'points':
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
    return;
  }
}