function requestJson(method,url,headers){
    let req = new XMLHttpRequest();
    req.open(method,url,false);
    for (let key in headers){
        req.setRequestHeader(key,headers[key]);
    }
    req.send();
    return JSON.parse(req.responseText);
}

function request(method,url,headers){
    let req = new XMLHttpRequest();
    req.open(method,url,false);
    for (let key in headers){
        req.setRequestHeader(key,headers[key]);
    }
    req.send();
    return req.responseText;
}

function request_twitch_id(){
    return requestJson('GET','http://localhost:6556/config').id;
}

function request_twitch_secret(){
    return requestJson('GET','http://localhost:6556/config').secret;
}


let token = 'no_token';

function request_token_json(){
    let url = 'https://id.twitch.tv/oauth2/token';
    url+='?client_id='+request_twitch_id();
    url+='&client_secret='+request_twitch_secret();
    url+='&grant_type=client_credentials';
    let json = requestJson('POST',url);
    setTimeout(()=>{
        token = 'no_token';
    },json.expires_in/3);
    return json;
}

function request_token(){
    if (token=='no_token') token = request_token_json().access_token; 
    return `Bearer ${token}`;
}

function get_helix_headers(){
    return {"Client-ID":request_twitch_id(),"Authorization":request_token()};
}

function request_channel_info(login){
    return requestJson('GET',`https://api.twitch.tv/helix/users?login=${login}`,get_helix_headers());
}

function get_subscriber_badges(channel_id){
    return requestJson('GET',`https://api.twitch.tv/kraken/chat/${channel_id}/badges`,{Accept:'application/vnd.twitchtv.v5+json',"Client-ID":request_twitch_id()}).subscriber;
}

let last_follow = '';

function get_followers(channel_id){
    let url = 'https://api.twitch.tv/helix/users/follows?to_id='+channel_id; 
    return requestJson('GET',url,get_helix_headers());
}

function get_new_follow(channel_id){
    if (last_follow=='') last_follow = get_followers(channel_id).data[0].from_name;
    else{
        let _last_follow = get_followers(channel_id).data[0].from_name;
        if (_last_follow!=last_follow) 
        {
            last_follow = _last_follow;
            return last_follow;
        }
    }
    return '';
}