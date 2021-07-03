const ytdl = require('ytdl-core')
const FFmpeg = require('fluent-ffmpeg')
const decoder = new require('lame').Decoder
const Speaker = require('speaker')
const volume = require('pcm-volume')

let current_ffmpeg
let speaker
let isPlaying = false
let v = new volume()

function set_up_stream(id){
    opt = {
        videoFormat: 'mp4',
        quality: 'lowest',
        audioFormat: 'mp3',
        filter (format) {
          return format.container === opt.videoFormat && format.audioBitrate
        }
      }
    const video = ytdl(`https://www.youtube.com/watch?v=${id}`, opt)  
    const { file, audioFormat } = opt
    let ffmpeg = FFmpeg(video)
    ffmpeg.format(audioFormat)
    ffmpeg.on('error',error=>{
        if (!error.toString().includes('SIGKILL')) console.log(error)
    })
    current_ffmpeg = ffmpeg
}

function play(id){
    isPlaying = true
    speaker = new Speaker({
        channels: 2,
        bitDepth: 16,
        sampleRate:44100
    })
    set_up_stream(id)
    current_ffmpeg.pipe(decoder())
    .pipe(v)
    .pipe(speaker)
    return new Promise(resolve=>{
        speaker.on('close',()=>{
            isPlaying = false
            v = new volume()
            resolve()
        })
    })
}


function stop(){
    current_ffmpeg.kill()
    speaker.close()
}

function change_volume(volume_lvl){
    v.setVolume(volume_lvl)
}

module.exports.play = play
module.exports.stop = stop
module.exports.change_volume = change_volume
module.exports.isPlaying = function(){
    return isPlaying
}