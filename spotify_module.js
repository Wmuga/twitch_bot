const req = require('request')
const http = require('http')
let opn = require('opn')
const opt = require('.\\bot_options.json')
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
            resolve(body)
        })
    });
}

let app_code
let access_token_data
let refresh_token


function requestJson(_method,_url,_headers){
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

function request_spotify_id(){
    return require('.\\bot_options.json')['spotify_client_id']
}

function request_spotify_secret(){
    return require('.\\bot_options.json')['spotify_client_secret']
}

function authorize(){
    const http_server = http.createServer(function(req,res){
        res.setHeader('Access-Control-Allow-Origin','*')
        let url_object = new URL(`http://localhost:4100${req.url}`)
        app_code = url_object.searchParams.get('code')
        switch (url_object.pathname){
            case '/callback':
                res.writeHead(200)
                res.end("<html><head></head><body><script>setTimeout(()=>{window.close()},2000)</script></body></html>")
                break;
            default:
                res.writeHead(404)
                res.end()
                break;
        }
        if (app_code) {
            console.log('Got app code')
            http_server.close()
        }
    })
    http_server.listen(4100,'localhost',()=>{
        let scopes = 'user-modify-playback-state user-read-playback-state'
        opn(encodeURI(`https://accounts.spotify.com/authorize?client_id=${opt.spotify_client_id}&response_type=code&redirect_uri=http://localhost:4100/callback&scope=${scopes}`))
    })
}

function get_simple_header(){
    return {
        "Content-Type":'application/x-www-form-urlencoded',
        "Authorization": `Basic ${encode_id_secret()}`
    }
}

function encode_id_secret(){
    return Buffer.from(`${request_spotify_id()}:${request_spotify_secret()}`).toString('base64')
}

function get_bearer_header(){
    return new Promise(async function(resolve){
        while(!access_token_data) await new Promise(resolve => setTimeout(resolve,100))
        resolve({
            "Authorization": `Bearer ${access_token_data['access_token']}`
        })
    })
    
}

function refresh_access_token(expires_in,refresh_token){
    return new Promise(async function(resolve){
        await new Promise(r => setTimeout(r,expires_in*1000))
        console.log('Refresh token')
        resolve(await requestJson('POST',`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${refresh_token}`,
        get_simple_header()))
    })
}

function get_token(){
    return requestJson('POST',`https://accounts.spotify.com/api/token?grant_type=authorization_code&code=${app_code}&redirect_uri=http://localhost:4100/callback`,
    get_simple_header())
}

async function set_token_updater(cancellation){
    authorize()
    while(!app_code) await new Promise(resolve => setTimeout(resolve,1000))
    console.log('Got token')
    access_token_data = await get_token()
    refresh_token = access_token_data['refresh_token']
    app_code = ''
    let cont = true
    while(cont){
        if (cancellation) cancellation.on('cancel',()=>{
            console.log('Cancelled')
            cont = false
        }) 
        access_token_data = await refresh_access_token(access_token_data['expires_in'],refresh_token)
    }
}


async function currently_playing(){
    let data = await request('GET', 'https://api.spotify.com/v1/me/player',await get_bearer_header())
    if (!data) return 'null'
    data = JSON.parse(data) 
    if (!data['item'] || JSON.parse(!data['is_playing'])) return 'null'
    let artists = ''
    data['item']['artists'].forEach(artist => {
        artists += artist['name']+ ' '
    });
    artists = artists.slice(0,-1)
    return{
        'Title':data['item']['name'],
        'Channel':artists,
        'img':data['item']['album']['images'].length>0 ? data['item']['album']['images'][(data['item']['album']['images']).length-2]['url'] :'null'
    }
}

async function is_playing(){
    let data = await request('GET', 'https://api.spotify.com/v1/me/player',await get_bearer_header())
    if (!data) return false
    data = JSON.parse(data) 
    return JSON.parse(data['is_playing'])
}

async function resume(){
    request('PUT', `https://api.spotify.com/v1/me/player/play?device_id=${opt.device_id}`,await get_bearer_header())
}

async function pause(){
    request('PUT', `https://api.spotify.com/v1/me/player/pause?device_id=${opt.device_id}`,await get_bearer_header())
}

async function skip(){
    request('POST', `https://api.spotify.com/v1/me/player/next?device_id=${opt.device_id}`,await get_bearer_header())
}

module.exports.set_token_updater = set_token_updater
module.exports.currently_playing = currently_playing
module.exports.resume = resume
module.exports.pause = pause
module.exports.is_playing = is_playing
module.exports.skip = skip