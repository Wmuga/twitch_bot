const opt = require('.\\bot_options.json')
const Audio = require("sound-play")
const fs = require("fs")
const soundboard = require('.\\sounds.json');

let viewers = [];
let active_translations = [];
let used_soundboard = false;
let isElv = false;
let isReq = false;
let request_users_list = []
let request_video_list = []

const getmessage = (channel,userstate,message) => ("["+channel+"]:"+userstate['username']+"-"+message);

function switch_layout(str) {
	let compl_str = '';
	str.split('').forEach(function(c){
		const keys   = 'QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqwertyuiop[]asdfghjkl;\'zxcvbnm,.йцукенгшщзхъфывапролджэячсмитьбю'.split('');
		const values = 'ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮQWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>йцукенгшщзхъфывапролджэячсмитьбюqwertyuiop[]asdfghjkl;\'zxcvbnm,.'.split('');
		let switchMap = new Map();
		for (let i=0;i<keys.length;i++) switchMap.set(keys[i],values[i]);
		compl_str += switchMap.get(c)==undefined ? c : switchMap.get(c);
	});
	return compl_str;
} 

function set_Elv(str){
	if (isElv)
		str = switch_layout(str);
	return str;
}

function messageHandler(channel, userstate, message, client,)
{	
	if (userstate['username']!='wmuga_bot'){
		if (moderate(channel, userstate, message, client)){
			test_for_new_viewer(channel,userstate['username'],client);
			let splitted_message = message.split(opt.command_prefix);
			if ((splitted_message.length>1) && (splitted_message[0].length==0)) 
				commandHandler(channel,userstate,splitted_message.join(''),client);
			}
	}
}

function moderate(channel, userstate, message, client){
	let services = [
		'streamdetails',
		'getviewers',
		'bigfollows',
		'yourfollows',
		'crazycash',
		'twitch_viewers'
	];
	
	let repeatedLetters = ['eе', 'tт', 'yу', 'oо0', 'pp','aа', 'hн', 'kк', 'xх', 'cс', 'bв', 'mм', 'rг'];
	services = services.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')));
	if ((new RegExp(services.join('|'), 'ig')).test(message)) 
	{
		console.log(userstate['username'] + " нарвался на бананду за спам");
		client.ban(channel,userstate['username'],'спам');
		return false;
	}
	return true;
}


function test_for_new_viewer(channel,username,client){
	if (!viewers.includes(username.toLowerCase())){
		viewers.push(username.toLowerCase());
		if (!(username in opt.custom_greetings)){
			client.say(channel, "Приветствую, @"+ username);
		}
		else{
			client.say(channel, opt.custom_greetings[username]);
		}
	}
}

function test_new_translation(channel){
	if (!active_translations.includes(channel.toLowerCase())){
		active_translations.push(channel.toLowerCase());
		Audio.play(soundboard["nya"]);
		console.log(`на ${channel} началась движуха`);
	}
}

function remove_translation(channel){
	if (active_translations.includes(channel.toLowerCase())){
		active_translations = active_translations.filter(name => name!=channel.toLowerCase());
		Audio.play(soundboard["nya"]);
		console.log(`на ${channel} закончилась движуха`);
	}
}

async function add_request(channel,userstate,client,data){
	let username = userstate['display-name']
	if (request_users_list.includes(username)){
		reply(channel,userstate,client,'уже есть твой заказ')
	}else{
		request_users_list.push(username)
		if (new RegExp('www.youtube.com/watch','ig').test(data.split(' ')[0])){
			let id = (data.split(' ')[0].split('v=')[1].split('&')[0])
			let videodata = await require('.\\twitch_requests').request('GET',`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${opt.youtube_api_key}&part=snippet`)
			request_video_list.push({"id":id,
									"Title":videodata['items'][0]['title'],
									"Channel":videodata['items'][0]['channelTitle']})
		}
		else{
			let videodata = await require('.\\twitch_requests').request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${data}&type=video&key=${opt.youtube_api_key}`))
			request_video_list.push({"id":videodata['items'][0]['id']['videoId'],
									"Title":videodata['items'][0]['snippet']['title'],
									"Channel":videodata['items'][0]['snippet']['channelTitle']})
		}
	}
}

function pop_request(){
	request_users_list.pop()
	request_video_list.pop()
}

function reply(channel, userstate, client, message){
	client.say(channel,'@' + userstate.username+' '+ message);
}

function commandHandler(channel,userstate,command,client){
	let splitted_command = command.toLowerCase().split(' ').filter(part => part.length>0);
	let username = userstate['display-name']
	if (splitted_command[0][0]>'z') {
		isElv = true;
		for (let i=0;i<splitted_command.length;i++) splitted_command[i] = switch_layout(splitted_command[i]);
	}
	console.log(splitted_command);
	switch(splitted_command[0])
	{
		case 'help':
			reply(channel,userstate,client,set_Elv('пока никакая помощь не предусмотрена'));
			break;
			/*
		case 'request':
		case 'r':
			if (splitted_command.length==1) 
				reply(channel,userstate,client,set_Elv('Можно заказать карту osu! если есть желаение. ') + opt.command_prefix +set_Elv('r/request/ *ссыль на карту*'));
			else{
				console.log(splitted_command[1]);
				if (!(/osu[.]ppy[.]sh[/]beatmapsets[/]/).test(splitted_command[1]))
					reply(channel,userstate,set_Elv('какая-то это неправильная ссылка'));
					else{
						fs.appendFileSync('D:\\Programms\\bot\\requests.txt', userstate.username + ' - ' +splitted_command[1]+'\n');
						reply(channel,userstate,client,set_Elv('добавлено'));
					}
			}
			break;*/
		case 'sound':
		case 's':
			if (splitted_command.length==1) 
					reply(channel,userstate,client,set_Elv('Можно воспроизвести различные звуки: ') + opt.command_prefix +set_Elv('sound/s *название*. Их посмотреть туть:') + ' https://docs.google.com/spreadsheets/d/12SQum-pyn170L1vffYvdLqGcLZIU7ndGKwJiGdnkkQ4/edit?usp=sharing');
			else{
				if (!used_soundboard){
					if (splitted_command[1] in soundboard)
					{
						if (splitted_command[1]=='ugu') {
							client.color('DodgerBlue');
							client.say(channel,'Ууугу');
						}
						Audio.play(soundboard[splitted_command[1]],0.7);
						used_soundboard=true;
						setTimeout(() =>{ used_soundboard = false},8000);
						if (splitted_command[1]=='ugu') client.color('OrangeRed');
					}
					else
						reply(channel,userstate,client,set_Elv('нет такого звука'));
				}
			}
			break;
		case 'sr-start':
                if (username == 'Wmuga') {
					isReq = true;
					client.say(channel,'Включены запросы музыки')
				}
				else reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
                break;
            case 'sr-close':
                if (username == 'Wmuga') {
					isReq = false;
					client.say(channel,'Выключены запросы музыки')
				}
				else reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
                break;        
            case 'sr':
                if (isReq){
					let data = splitted_command.splice(1).join(" ")
                	add_request(channel,userstate,client,data)
				}else{
					reply(channel,userstate,client,'Пока низя')
				}
                break;
			case 'sr-skip':
				break;
			default:
				reply(channel,userstate,client,'нет такой команды');
				break;
	}
	isElv = false;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports.messageHandler = messageHandler;
module.exports.getmessage = getmessage;

module.exports.test_new_translation = test_new_translation;
module.exports.remove_translation = remove_translation;

module.exports.pop_request = pop_request;
module.exports.request_video_list = request_video_list;