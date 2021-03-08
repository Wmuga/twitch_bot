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
    username.style.color = userstate.color==undefined ? white : userstate.color; 
    username.innerHTML = userstate['display-name']; 
    new_msg.innerHTML += username.outerHTML+emote_parse(userstate.emotes,filter.innerText);
    new_msg.classList.add('msg');
    document.getElementsByClassName('chat')[0].appendChild(new_msg);
}

const client = new tmi.client(options);

console.log('Connecting')

client.on('message',(channel,userstate,message) =>{
    add_new_message(userstate,message);
});

client.on('connected',() =>{
    console.log('connected');
});

client.connect();
