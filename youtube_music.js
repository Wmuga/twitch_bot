const ytdl = require('ytdl-core')
const FFmpeg = require('fluent-ffmpeg')
const decoder = new require('lame').Decoder
const Speaker = require('speaker')
const volume = require('pcm-volume')
const req = require('request')

class YoutubeMusic{
  constructor(options){
    this.options = {
      "restrictions":{
        "Mod":options?.restrictions?.Mod ?? 5,
        "User":options?.restrictions?.User ?? 2
      },
      "standart_volume":  options.standart_volume ?? 0.4,
      "api_key": options.api_key,
      "time_limit": options.time_limit?? 10*60
    }
    this.queue = []
    this._isPlaying = false
    this.v = new volume()
    this.v.setVolume(options.standart_volume)
  }

  set_up_stream(id){ 
    this.video = ytdl(`https://www.youtube.com/watch?v=${id}`, {
        quality: 'highestaudio'
    })  
    this.ffmpeg = FFmpeg({
        source:this.video,

        })
    this.ffmpeg.on('error',error=>{
        if (!error.toString().includes('SIGKILL')) console.log(error)
    })
    this.ffmpeg.noVideo()
    .toFormat('mp3')
    .withAudioFrequency(44100)
  }

  stop(){
    this.speaker?.close()
  }

  play(id){
    this._isPlaying = true
    this.speaker = new Speaker({
        channels: 2,
        bitDepth: 16,
        sampleRate:44100
    })
    this.set_up_stream(id)
    this.ffmpeg
    .pipe(decoder())
    .pipe(this.v)
    .pipe(this.speaker)
    return new Promise(resolve=>{
        this.speaker.on('close',()=>{
            this.ffmpeg.kill()
            this.v = new volume()
            this.v.setVolume(this.options.standart_volume)
            this.video.destroy()
            this.queue.shift()
            this._isPlaying = false
            resolve()
        })
    })
  }
  change_volume(volume_lvl){
    this.v.setVolume(Number(volume_lvl)?? this.options.standart_volume)
  }

  is_playing(){
    return this._isPlaying
  }

  add_to_queue(username,user_mod,search_data){
    let req_count = this.count_requests(username)
    if (user_mod==0 && req_count>this.options.restrictions.User || user_mod==1 && req_count>this.options.restrictions.Mod)
      return "Превышен лимит запросов"
    let videodata  
    if (new RegExp('watch/\?v=','ig').test(search_data.split(' ')[0])){
      let id = (search_data.split(' ')[0].split('v=')[1].split('&')[0])
      videodata = get_data(id,this.options.api_key)
    }
    else{
      if (new RegExp('tu\.be','ig').test(data.split(' ')[0])){
        let id = (data.split(' ')[0].split('be/').pop())
        videodata = get_data(id,this.options.api_key)
      }
      else{
        videodata = search(search_data,this.options.api_key)
      }
    }
    if (!videodata) return 'Не найдено видео по данному запросу'
    let length = 0
    let str_length = get_length(videodata.id,this.options.api_key)
    length += Number(str_length.split('H')[0])*3600||0
    length += Number(str_length.split('H').pop().split('M')[0])*60||0
    length += Number(str_length.split('H').pop().split('M').pop().split('S')[0])||0
    if(length>this.options.time_limit) return `Слишком долгое видео`
    this.queue.push({username:{
      ...videodata,
      "length":length,
    }})
    return `${videodata.Channel} - ${videodata.Title} добавлен в очередь. #${this.queue.length} в очереди`
  }
  count_requests(name){
    let count = 0
    for (let data of this.queue){
      if (name in data) count++
    }
    return count
  }

  currently_playing(){
    return this.queue.length>0?this.queue[0]:null
  }

  setup_resolve_requests(cancellation){
    let interval = setInterval(()=>{
      if(!this.is_playing && this.queue.length>0){
        this.play(this.queue[0].id)
      }
    },1000)
    cancellation?.on('cancel',()=>clearInterval(interval))
  }

  clear_queue(){
    this.queue = []
  }
}

function extract_essentials(videodata){
  return videodata['items'].length>0?{
    "id":videodata['items'][0]['id']['videoId'],
    "Title":videodata['items'][0]['snippet']['title'],
    "Channel":videodata['items'][0]['snippet']['channelTitle'],
    'img':videodata['items'][0]['snippet']['thumbnails']['medium']['url']
  } : null
}

async function get_data(id,api_key){
  let videodata = await require('.\\twitch_requests').request('GET',`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${api_key}&part=snippet`)
  return extract_essentials(videodata)
}

async function search(data,api_key){
  let videodata = await request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${data}&type=video&key=${api_key}`))
  return extract_essentials(videodata)
}

async function get_length(id,api_key){
  let videodata = await request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=${api_key}`))
  return videodata['items'][0]['duration'].substring(2)
}

function request(_method,_url,_headers){
  let req_options = {
      method:_method,
      url:_url,
  }
  if (_headers) req_options.headers = _headers;
  return new Promise(resolve =>{
      req(req_options,async function(error, response,body){
          if (error) {
              console.log(error);
              body = await request(_method,_url,_headers);
              resolve(body);
          }
          resolve(JSON.parse(body))
      })
  });
}


module.exports.YoutubeMusic = YoutubeMusic
