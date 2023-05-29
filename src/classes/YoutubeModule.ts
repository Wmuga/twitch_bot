import { MusicInfo } from '../Types/MusicInfo';
import {IMusicProvider} from '../interfaces/IMusicProvider';
import {YoutubeOptions} from '../Types/BotOptions';

import ytdl from 'ytdl-core'; 
import FFmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import {Decoder} from 'lame';
import Speaker from 'speaker';
import Volume from 'pcm-volume';
import req, {CoreOptions, Headers} from 'request';
import internal from 'stream';

export class YoutubeMusic implements IMusicProvider{
  private _is_ready:boolean;
  private _is_playing:boolean;
  private _resolve_loop?:NodeJS.Timer;

  private _mod_limit:number;
  private _user_limit:number;

  private _queue:MusicInfo[];
  private _api_key:string;
  private _time_limit:number;
  
  private _standart_volume:number;
  private _volume:Volume;
  private _speaker?:Speaker;
  private _ffmpeg?:FfmpegCommand;
  private _video?:internal.Readable;

  private _ytReg1:RegExp = new RegExp('watch/\?v=','ig');
  private _ytReg2:RegExp = new RegExp('tu\.be','ig');

  constructor(options:YoutubeOptions){
    this._is_ready = true;
    this._is_playing = false;
    this._volume = new Volume();
    this._queue = [];

    this._mod_limit = options.restrictions?.mod ?? 5;
    this._user_limit = options.restrictions?.user ?? 2;
    this._api_key = options.api_key;
    this._standart_volume = options.standart_volume ?? 0.4;
    this._time_limit = options.time_limit ?? 10*60;


    this._volume.setVolume(this._standart_volume);
  }

  isReady():boolean{
    return this._is_ready;
  }

  isPlaying():boolean{
    return this._is_playing;
  }

  add(username:string,isMod:boolean,search_data:string):Promise<[boolean, string]>{
    return this.addAsync(username,isMod,search_data);
  }

  async addAsync(username:string,isMod:boolean,search_data:string):Promise<[boolean, string]>{
    let requests = this.count_requests(username);
    if (isMod == false && requests > this._user_limit
      || isMod == true && requests > this._mod_limit)
      return [false, 'превышен лимит запросов'];
    
    let videodata:MusicInfo | undefined = undefined;

    if (this._ytReg1.test(search_data.split(' ')[0])){
      let id = (search_data.split(' ')[0].split('v=')[1].split('&')[0])
      videodata = await this.getData(id);
    }

    if (!videodata && this._ytReg2.test(search_data.split(' ')[0])){
      let id = (search_data.split(' ')[0].split('be/').pop())
      videodata = await this.getData(id??"");
    }

    if (!videodata){
      videodata = await this.search(search_data);
    }

    if (!videodata){
      return [false, 'Не найдено видео по данному запросу'];
    }

    let duration = await this.getLength(videodata.id);
    if (duration > this._time_limit) 
      return [false,'Превышено ограничение по длине'];

    this._queue.push({
      ...videodata,
      username,
      duration
    })

    return [true, `${videodata.artist} - ${videodata.track} добавлен в очередь. #${this._queue.length} в очереди`];
  }

  play():void{
    this._resolve_loop = setInterval(()=>{
      if(this._is_playing || this._queue.length == 0) return;
      this.startPlaying(this._queue[0].id);
    }, 1000)
  }

  stop():void{
    if (!this._resolve_loop) return;
    clearInterval(this._resolve_loop);
    this.skip();
    this._queue = [];
  }

  skip():void{
    if (!this._is_playing) return;
    this._speaker?.close(true);
  }

  changeVolume(volume:number):void{
    if (!this._is_playing) return;
    this._volume.setVolume(volume);
  }

  current():MusicInfo | undefined{
    if (!this._is_playing) return;
    return this._queue[0];
  }

  private startPlaying(id:string):Promise<void>{
    this._is_playing = true;
    this._speaker = new Speaker({
      channels: 2,
      bitDepth: 16,
      sampleRate: 44100
    });


    this._video = ytdl(`https://www.youtube.com/watch?v=${id}`, {
      quality: 'highestaudio'
    });
    
    this._ffmpeg = FFmpeg({source:this._video});
    this._ffmpeg.on('error',error=>{
      if (!error.toString().includes('SIGKILL')) console.log(error);
    });
   
    this._ffmpeg
        .noVideo()
        .toFormat('mp3')
        .withAudioFrequency(44100)
        .pipe(Decoder())
        .pipe(this._volume)
        .pipe(this._speaker)
    
    return new Promise(resolve=>{
      this._speaker?.on('close',()=>{
        this._ffmpeg?.kill('SIGKILL');
        this._volume = new Volume();
        this._volume.setVolume(this._standart_volume);
        this._video?.destroy();
        this._queue.shift();
        this._is_playing = false;
        resolve();
      })
    })
  }

  private async getLength(id:string):Promise<number>{
    let length = 0
    let str_length = await this.getLengthStr(id)
    length += Number(str_length.split('H')[0])*3600||0
    length += Number(str_length.split('H').pop()!.split('M')[0])*60||0
    length += Number(str_length.split('H').pop()!.split('M').pop()!.split('S')[0])||0
    return length
  }

  private count_requests(name:string){
    let count = 0
    for (let data of this._queue){
      if (name === data.username) count++
    }
    return count
  }

  private async getLengthStr(id:string):Promise<string> {
    let videodata = await request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=${this._api_key}`),true)
    if(!videodata) return ''
    return (videodata as any)['items'][0]['contentDetails']['duration'].substring(2)
  }

  private async search(data:string):Promise<MusicInfo | undefined>{
    let videodata = await request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${data}&type=video&key=${this._api_key}`),true)
    return this.extract_essentials(videodata)
  }

  private async getData(id:string):Promise<MusicInfo | undefined>{
    let videodata = await request('GET',`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${this._api_key}&part=snippet`,true)
    return this.extract_essentials(videodata)
  }

  private extract_essentials(videodata:any):MusicInfo | undefined{
    if (!videodata) return undefined
    return videodata['items'].length>0
    ?{
      id:videodata['items'][0]['id']['videoId'],
      track:videodata['items'][0]['snippet']['title'],
      artist:videodata['items'][0]['snippet']['channelTitle']
    } 
    : undefined
  }
}


function request(method:string,url:string,toJson:boolean,headers?:Headers){
  let request_options:CoreOptions = {
    method
  };
  if (headers) request_options.headers = headers;
  return new Promise(resolve=>{
    req(url,request_options,(error,_,body)=>{
      if (error){
        console.log(error);
        resolve(undefined)
        return;
      }
      resolve(toJson? JSON.parse(body) : body);
    })
  })
}

