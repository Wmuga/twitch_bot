const ytdl = require('ytdl-core')
const FFmpeg = require('fluent-ffmpeg')
const decoder = new require('lame').Decoder
const Speaker = require('speaker')
const volume = require('pcm-volume')

let video 
let current_ffmpeg
let speaker
let isPlaying = false
let v = new volume()

function set_up_stream(id){ 
    video = ytdl(`https://www.youtube.com/watch?v=${id}`, {
        quality: 'highestaudio'
    })  
    let ffmpeg = FFmpeg({
        source:video,

        })
    ffmpeg.on('error',error=>{
        if (!error.toString().includes('SIGKILL')) console.log(error)
    })
    ffmpeg.noVideo()
    .toFormat('mp3')
    .withAudioFrequency(44100)
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
    current_ffmpeg
    .pipe(decoder())
    .pipe(v)
    .pipe(speaker)
    return new Promise(resolve=>{
        speaker.on('close',()=>{
            current_ffmpeg.kill()
            isPlaying = false
            v = new volume()
            video.destroy()
            resolve()
        })
    })
}


function stop(){
    if (speaker) speaker.close()
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