const options = {
    options: {
        debug:false,
    },
    connection: {
        reconnect: true,
    },
    channels: ['wmuga'],
};


let xhr = new XMLHttpRequest();
xhr.open('GET','https://badges.twitch.tv/v1/badges/global/display',false);
xhr.send();
let badges = JSON.parse(xhr.responseText)['badge_sets'];

function parse_emote_data(data){
    let parsed_data = JSON.parse('{}');
    for (let id in data){
        for (let length in data[id]){
            length=data[id][length].split('-');
            parsed_data[id] = {"start":Number(length[0]),"length":(Number(length[1])-Number(length[0])+1)}
        }
    } 
   return parsed_data;
}

function emote_parse(emotes,message){
    emotes = parse_emote_data(emotes);
    splitted_message=message.split(' ');
    for (let id in emotes){
        let emote_code = message.substring(emotes[id].start,emotes[id].start+emotes[id].length);
        for (let i =0; i<splitted_message.length;i++){
            if (splitted_message[i]==emote_code) splitted_message[i] = '<img src = http://static-cdn.jtvnw.net/emoticons/v1/'+id+'/1.0>';
        }
    }
    return splitted_message.join(' ');
}

function add_new_message(userstate,message){
    if (document.getElementsByClassName('msg').length>4) {
        let messages = document.getElementsByClassName('msg');
        messages[0].parentElement.removeChild(messages[0]);
    }
    let new_msg = document.createElement('div');
    let filter = document.createElement('p');
    filter.innerHTML = message;
    for (let badge in userstate.badges)
        {
            new_msg.innerHTML+="<img src="+badges[badge]['versions'][userstate.badges[badge]]['image_url_1x']+">";
        }
    let username = document.createElement('div');
    username.style.color = userstate.color==null ? white : userstate.color; 
    username.innerHTML = userstate['display-name']; 
    new_msg.innerHTML += username.outerHTML+emote_parse(userstate.emotes,filter.innerText);
    new_msg.classList.add('msg');
    document.getElementsByClassName('chat')[0].appendChild(new_msg);
}

function check_for_commands(username,message){
    if(message[0]=='!'){
        message = message.substring(1)
        let splitted_message = message.split(' ')
        switch (splitted_message[0]){
            case 'sr-start':
                if (username == 'Wmuga') {
                    let song_overlay = document.getElementsByClassName('song-overlay')[0]
                    song_overlay.hidden = false
                }
                break;
            case 'sr-close':
                if (username == 'Wmuga') {
                    let song_overlay = document.getElementsByClassName('song-overlay')[0]
                    song_overlay.hidden = true
                }
                break;    
            default:
                break;        
        }
    }
}

const client = new tmi.client(options);

console.log('Connecting')

client.on('message',(channel,userstate,message) =>{
    add_new_message(userstate,message);
    check_for_commands(userstate['display-name'],message);
});

client.on('connected',() =>{
    console.log('connected');
});

client.on('raided',(channel, username, viewers) =>{
    add_new_event('raid',username);
})

client.connect();

//Events
event_array = [];

function add_new_event(_event,_name){
    event_array.splice(0,0,{
        event:_event,
        name:_name
    })
}

function play_sound(sound_class){
    let audio = document.getElementsByClassName(sound_class)[0];
    audio.autoplay = true;
    audio.play();
}

function set_follow_event(name){
    let event = document.createElement('div');
    event.classList.add('event');
    event.innerText = `Спасибо за фоллоу, ${name}`;
    document.getElementsByClassName('event_overlay')[0].appendChild(event);
    play_sound('follow-sound');
    return new Promise(resolve => setTimeout(function(){
        let rem = document.getElementsByClassName('event')[0];
        rem.parentNode.removeChild(rem);
        resolve();
    },3000))
}

function set_raid_event(name){
    let event = document.createElement('div');
    event.classList.add('event');
    event.innerText = `Воу! рейд от ${name}`;
    document.getElementsByClassName('event_overlay')[0].appendChild(event);
    play_sound('raid-sound');
    return new Promise(resolve => setTimeout(function(){
        let rem = document.getElementsByClassName('event')[0];
        rem.parentNode.removeChild(rem);
        resolve();
    },2500))
}

async function resolve_events(){
    while(true){
        if (event_array.length>0){
            let event = event_array.pop();
            switch (event.event){
                default:
                    break;
                case ('follow'):
                    await set_follow_event(event.name);
                    break;   
                case ('raid'):
                    await set_raid_event(event.name);
                    break;
            }
        }
        await new Promise(resolve => setTimeout(resolve,500));
    }
}

async function check_events(){
    while(true){
        let follow = get_new_follow(164555591);
        if (follow!='') add_new_event('follow',follow);
        await new Promise(resolve => setTimeout(resolve,3000));
    }
}

async function check_music() {
    while (true)
    {
        let data = request('GET','http://localhost:6556/requests')
        if (data && data !='\"null\"'){
            data = JSON.parse(data)
            document.getElementsByClassName('artist')[0].innerHTML = data['Channel']
            document.getElementsByClassName('song-name')[0].innerHTML = data['Title']
        }else{
            document.getElementsByClassName('artist')[0].innerHTML = 'Artist'
            document.getElementsByClassName('song-name')[0].innerHTML = 'Title'
        }
        await new Promise(resolve => setTimeout(resolve,1000));
    }
    
}

check_events();
resolve_events();
check_music();