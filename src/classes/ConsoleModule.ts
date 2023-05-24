import readline, {Interface} from 'readline'
import { SendEventHandler, SendSelfEventHandler, DBUpdateEventHandler, DBGetEventHandler, ResizeEventHandler, ConsoleEventHandler, ConsoleEvent } from "../Types/ConsoleEventHandlers";
import { MusicInfo } from "../Types/MusicInfo";
import { AUserInterface } from './AUserInterface';

export class ConsoleModule extends AUserInterface{
  
  private _console: Interface;

  constructor(){
    super();
    this._console = readline.createInterface({
      input:process.stdin,
      output:process.stdout
    });

    this._console.on('line',(input)=>{
      let command = input.split(' ')
      switch(command[0]){
        case 'send':
          this.checkSendCommand(command);
          break;
        case 'resize':
          this.checkResizeCommand(command);
          break;
        case 'db-update':
          this.checkDBUpdateCommand(command);
          break;
        case 'db-get':
          this.checkDBGetCommand();
          break;
        default:
          console.log('Неизвестная команда');
          return;
      }
    })
  }
  
  sendString(str: string): void {
    console.log(str);
  }
  sendMusic(music: MusicInfo): void {
    console.log(music);
  }

  private checkSendCommand(command:Array<string>){
    if (command.length < 3) {
      console.log('Недостаточно аргументов');
      return;
    }
    let channel = command[1];
    let message = command.slice(2).join(' ')
    
    if (channel == this._self_channel && this._handlers['send-self']){
      (this._handlers['send-self'] as SendSelfEventHandler)(message);
      return;
    }

    if (this._handlers['send']){
      (this._handlers['send'] as SendEventHandler)(channel,message);
    }
  }
  private checkResizeCommand(command:Array<string>){
    if (command.length < 2) {
      console.log('Недостаточно аргументов');
      return;
    }
    let small:boolean;

    switch(command[1]){
      case 'small':
      case 'big':
        small = command[1] == 'small';
        break;
      default:
        console.log('Неправильный аргумент');
        return;
    }

    if (this._handlers['resize']){
      (this._handlers['resize'] as ResizeEventHandler)(small);
    }
  }

  private checkDBUpdateCommand(command:Array<string>){
    if (command.length != 3) {
      console.log('Неверное аргументов');
      return;
    }

    let username = command[1];
    let points = Number(command[2]);
    
    if (isNaN(points)){
      console.log('Неправильное количество поинтов');
      return;
    }

    if (this._handlers['db-update']){
      (this._handlers['db-update'] as DBUpdateEventHandler)(username, points);
    }
  }

  private checkDBGetCommand(){
    if (this._handlers['db-get']){
      (this._handlers['db-get'] as DBGetEventHandler)();
    }
  }

}