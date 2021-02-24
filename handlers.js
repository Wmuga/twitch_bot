const opt = require('.\\bot_options.json')
const Audio = require("sound-play")
const fs = require("fs")
const soundboard = require('.\\sounds.json')

var viewers = [];
var active_translations = [];
var used_soundboard = false;

const getmessage = (channel,userstate,message) => ("["+channel+"]:"+userstate['username']+"-"+message);

function messageHandler(channel, userstate, message, client,)
{	
	if (userstate['username']!='wmuga_bot'){
		if (moderate(channel, userstate, message, client)){
			test_for_new_viewer(channel,userstate['username'],client);
			var splitted_message = message.split(opt.command_prefix);
			if ((splitted_message.length>1) && (splitted_message[0].length==0)) 
				commandHandler(channel,userstate,splitted_message.join(''),client);
			}
	}
}

function moderate(channel, userstate, message, client){
	var services = [
		'streamdetails',
		'getviewers',
		'bigfollows',
		'yourfollows',
		'crazycash',
		'twitch_viewers'
	];
	
	var repeatedLetters = ['eе', 'tт', 'yу', 'oо0', 'pp','aа', 'hн', 'kк', 'xх', 'cс', 'bв', 'mм', 'rг'];
	services = services.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')));
	/*
	var phrases = [
		'отключить рекламу напиши нам',
		'пoдними стрим в топ',
		'wanna become famous', 
		'лучшее качество и самые низкие цены',
	];
	var forbiddenWords = [
		'PRIVMSG'
	];
	var wordCombs = [

	];
	phrases = phrases.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')))
	forbiddenWords = forbiddenWords.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')))
	wordCombs = wordCombs.map(e => repeatedLetters.reduce((res, letters) => res.replace(new RegExp(`[${letters}]`, 'ig'), `[${letters}]`), e.split('').join('\\s*')))
	*/
	if ((new RegExp(services.join('|'), 'ig')).test(message)) 
	{
		console.log(userstate['username'] + " нарвался на бананду за спам");
		client.ban(channel,userstate['username'],'спам');
		return false;
	}
	return true;
}

function test_for_ping(channel,userstate,message){
	var regNameLatin = /Wmuga/i;
	var regNameRus = /[ВШ][мm][уыаay]+г/i;
	if ((regNameLatin.test(message) && !(new RegExp(/Wmuga_/i).test(message)))  || (regNameRus.test(message)))
	{
		Audio.play(soundboard["nya"]);
		console.log("Пинганули");
		console.log(getmessage(channel,userstate,message));
	}
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

function test_for_new_translation(channel,userstate,message, connection){
	if (!active_translations.includes(channel.toLowerCase())){
		active_translations.push(channel.toLowerCase());
		Audio.play(soundboard["nya"]);
		if (connection) connection.write("tOn"+channel+opt.tcp_message_splitter);
		console.log("на " +channel + " началась движуха");
		console.log(getmessage(channel,userstate,message));
	}
}

function commandHandler(channel,userstate,command,client){
	var splitted_command = command.split(' ').filter(part => part.length>0);
	console.log(splitted_command);
	switch(splitted_command[0])
	{
		case 'help':
		case 'хелп':
		case 'хэлп':
			client.say(channel,'@' + userstate.username+ ' пока никакая помощь не предусмотрена');
			break;
		case 'request':
		case 'заказ':
		case 'r':
			if (splitted_command.length==1) 
				client.say(channel,'@' + userstate.username+ ' Можно заказать карту osu! если есть желаение. ' + opt.command_prefix +'r/request/заказ *ссыль на карту*');
			else{
				console.log(splitted_command[1]);
				if (!(/osu[.]ppy[.]sh[/]beatmapsets[/]/).test(splitted_command[1]))
					client.say(channel,'@' + userstate.username+ ' какая-то это неправильная ссылка');
					else{
						fs.appendFileSync('D:\\Programms\\bot\\requests.txt', userstate.username + ' - ' +splitted_command[1]+'\n');
						client.say(channel,'@' + userstate.username+ ' добавлено');
					}
			}
			break;
		case 'sound':
		case 's':
		if (splitted_command.length==1) 
				client.say(channel,'@' + userstate.username+ ' Можно воспроизвести различные звуки: ' + opt.command_prefix +'sound/s *название*. Их посмотреть туть: https://docs.google.com/spreadsheets/d/12SQum-pyn170L1vffYvdLqGcLZIU7ndGKwJiGdnkkQ4/edit?usp=sharing');
		else{
			if (!used_soundboard){
				if (splitted_command[1] in soundboard)
				{
					Audio.play(soundboard[splitted_command[1]]);
					used_soundboard=true;
					setTimeout(() =>{ used_soundboard = false},8000);
				}
				else
					client.say(channel,'@' + userstate.username+' нет такого звука');
			}
		}
		break;
		default:
			client.say(channel,'@' + userstate.username+ ' нет такой команды');
			break;
	}
}

function pingerHandler(channel, userstate, message, connection)
{
	if((connection) && (channel!="#wmuga")) connection.write('msg'+getmessage(channel,userstate,message)+opt.tcp_message_splitter);
	if(userstate['username']!='wmuga') test_for_ping(channel,userstate,message);
	if(userstate['username']!='twistr_shade') test_for_new_translation(channel,userstate,message, connection);
}

async function sendAllOnline(connection){
	active_translations.forEach(tr => {
		connection.write("tOn"+tr+opt.tcp_message_splitter);
		sleep(100);
	});
	viewers.forEach(v => {
		connection.write("nuj"+v+opt.tcp_message_splitter);
		sleep(100);
	});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports.sendAllOnline = sendAllOnline;
module.exports.messageHandler = messageHandler;
module.exports.pingerHandler = pingerHandler;