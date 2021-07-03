const req = require('request')

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

function request_no_json(_method,_url,_headers){
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

function request_id(){
    const config_file = require('.\\overlay\\config.json');
    return config_file.id;
}

function request_secret(){
    const config_file = require('.\\overlay\\config.json');
    return config_file.secret;
}



async function request_token_json(){
    let url = 'https://id.twitch.tv/oauth2/token';
    url+='?client_id='+request_id();
    url+='&client_secret='+request_secret();
    url+='&grant_type=client_credentials';
    return await request('POST',url);
}

async function request_token(){
    let token = (await request_token_json()).access_token;
    return `Bearer ${token}`;
}

async function get_helix_headers(){
    let auth = await request_token();
    return {"Client-ID":request_id(),"Authorization":auth};
}


let last_follow = '';

async function get_followers(channel_id){
    let url = 'https://api.twitch.tv/helix/users/follows?to_id='+channel_id; 
    let headers = await get_helix_headers();
    return request('GET',url,headers);
}

async function get_new_follow(channel_id){
    if (last_follow=='') last_follow = (await get_followers(channel_id)).data[0].from_name;
    else{
        let _last_follow = (await get_followers(channel_id)).data[0].from_name;
        if (_last_follow!=last_follow) 
        {
            last_follow = _last_follow;
            return last_follow;
        }
    }
    return '';
}

async function get_user_info(channel_name){
    return await request('GET',`https://api.twitch.tv/helix/users?login=${channel_name}`,await get_helix_headers());
}

async function get_stream_info(channel_name){
    return await request('GET',`https://api.twitch.tv/helix/streams?user_login=${channel_name}`,await get_helix_headers());
} 

module.exports.request = request;
module.exports.get_new_follow = get_new_follow;
module.exports.get_stream_info = get_stream_info;