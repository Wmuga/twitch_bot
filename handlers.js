const opt = require('.\\bot_options.json')
const Audio = require("sound-play")
const soundboard = require('.\\sounds.json');
const ytm = require('.\\youtube_music.js');
const spoty = require('.\\spotify_module.js')
const io = require('socket.io-client')
const sqlite = require('better-sqlite3')
const uf = require('.\\usefull_functions.js')

let viewers = []
let current_viewers = []
let used_soundboard = false
let isElv = false
let isReq = false
let isAutoplaySpoty = false
let request_users_list = []
let request_video_list = []
let currently_playing = 'null'
let socket = io('http://192.168.1.3:3001', { transports : ['websocket'] })
let db = new sqlite(`${__dirname}\\viewers.db`)

socket.on('connect',()=>{
	socket.emit('twitchBot')
})

const getmessage = (channel,userstate,message) => ("["+channel+"]:"+userstate['username']+"-"+message);

function set_Elv(str){
	if (isElv)
		str = uf.switch_layout(str);
	return str;
}

function messageHandler(channel, userstate, message, client,)
{	
	if (userstate['username']!='wmuga_bot'){
		if (moderate(channel, userstate, message, client)){
			test_for_new_viewer(userstate['username']);
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
		'twitch_viewers',
		'streamskill',
		'kutt.it/zqZNce',
		'smsc.sc/?2l0t0ew'
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


function test_for_new_viewer(username){
	if (!viewers.includes(username.toLowerCase())){
		viewers.push(username.toLowerCase());
		socket.emit('viewer',username in opt.custom_greetings ? opt.custom_greetings[username] : "Приветствую, @"+ username)
	}
}


async function add_request(channel,userstate,client,data){
	let username = userstate['display-name']
	if (request_users_list.includes(username) && username!='Wmuga'){
		uf.reply(channel,userstate,client,'уже есть твой заказ')
	}else{
		let videodata
		if (new RegExp('v=','ig').test(data.split(' ')[0])){
			let id = (data.split(' ')[0].split('v=')[1].split('&')[0])
			videodata = await require('.\\twitch_requests').request('GET',`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${opt.youtube_api_key}&part=snippet`)
		}
		else{
			videodata = await require('.\\twitch_requests').request('GET',encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${data}&type=video&key=${opt.youtube_api_key}`))
		}
		if (videodata['items'].length>0){
			request_users_list.push(username)
			request_video_list.push({"id":videodata['items'][0]['id']['videoId'],
									"Title":videodata['items'][0]['snippet']['title'],
									"Channel":videodata['items'][0]['snippet']['channelTitle'],
								'img':videodata['items'][0]['snippet']['thumbnails']['medium']['url']})
			client.say(channel,`${videodata['items'][0]['snippet']['channelTitle']}-${videodata['items'][0]['snippet']['title']} добавлен в очередь. #${request_users_list.length} в очереди`)						
		}
		else{
			uf.reply(channel,userstate,client,'Не нашел такого')
		}
	}
}

function pop_request(){
	request_users_list.shift()
	request_video_list.shift()
}

async function resolve_music_requests(){
	while(true){
		if (!ytm.isPlaying()){
			if (request_video_list.length>0){
				ytm.change_volume(0.4)
				spoty.pause()
				isAutoplaySpoty = false
				currently_playing = request_video_list[0]
				console.log(currently_playing)
				socket.emit('song',JSON.stringify(currently_playing))
				pop_request()
				await ytm.play(currently_playing['id'])
				socket.emit('song','null')
				isAutoplaySpoty = true
			}
			else{
				if (isAutoplaySpoty){
					spoty.resume()
					isAutoplaySpoty = false
				}
				currently_playing = await spoty.currently_playing()
				socket.emit('song',JSON.stringify(currently_playing))
			}
		}
		await uf.sleep(1000)
	}
}


async function commandHandler(channel,userstate,command,client){
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
			uf.reply(channel,userstate,client,set_Elv('Хелпа с командами в доках: ')+ 'https://docs.google.com/spreadsheets/d/1jwL1IHtfxQZlZf__QWsfCIYeDOebPZTViDim7wORgq4/edit?usp=sharing');
			break;
		case 'sound':
		case 's':
			if (splitted_command.length==1) 
					uf.reply(channel,userstate,client,set_Elv('Можно воспроизвести различные звуки: ') + opt.command_prefix +set_Elv('sound/s *название*. Их посмотреть туть:') + ' https://docs.google.com/spreadsheets/d/12SQum-pyn170L1vffYvdLqGcLZIU7ndGKwJiGdnkkQ4/edit?usp=sharing');
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
						uf.reply(channel,userstate,client,set_Elv('нет такого звука'));
				}
			}
			break;
		case 'sr-start':
                if (username == 'Wmuga') {
					isReq = true;
					client.say(channel,'Включены запросы музыки')
					isAutoplaySpoty = true
				}
				else uf.reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
                break;
		case 'sr-stop':
        case 'sr-close':
		case 'sr-end':	
            if (username == 'Wmuga') {
				isReq = false;
				client.say(channel,'Выключены запросы музыки')
				request_users_list = []
				request_video_list = []
				ytm.stop()
				spoty.pause()
				isAutoplaySpoty = false
				socket.emit('song','null')
			}
			else uf.reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
            break;    
        case 'sr':
			if (splitted_command.length==1)
				uf.reply(channel,userstate,client,'Можно заказать музыку. !sr *название трека*/*ссылка на ютуб*')
			else{
				if (isReq || username == 'Wmuga'){
					let data = splitted_command.splice(1).join(" ")
					add_request(channel,userstate,client,data)
				}else{
					uf.reply(channel,userstate,client,set_Elv('Пока низя'))
				}
			}
            break;
		case 'sr-skip':
			if (username == 'Wmuga' || userstate['mod']) {
				if (ytm.isPlaying()) {
					console.log('Skipped yt request')
					ytm.stop()
				}
				else{ 
					console.log('Skipped spotify track')
					spoty.skip()
				}
				socket.emit('song','null')
			}else uf.reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
			break;
		case 'sr-volume':
			if (username == 'Wmuga' || userstate['mod']) {
				if (splitted_command.length>1)
					ytm.change_volume(parseFloat(splitted_command[1]))
			}
			else uf.reply(channel,userstate,client,set_Elv('Не трожь кнопку'))
			break;	
		case 'roll':
			if (splitted_command.length==1)
				uf.reply(channel,userstate,client,set_Elv('!roll *кол-во кубов*d*макс значение куба*'))
			else{
				let data = splitted_command[1].split('d')
				let count = Number(data[0])
				let max = data.length>1 ? Number(data[1]) : 6
				let l = []
				for (let i=0;i<count;i++) l.push(Math.floor(Math.random()*max)+1)
				client.say(channel,`${channel,l.join(' + ')} = ${l.reduce((a, b) => a + b, 0)}`)	
			}	
			break
		case 'points':
			if (splitted_command.length==1 || splitted_command[1]!='top')
				uf.reply(channel,userstate,client,set_Elv(`У тебя ${get_points_viewer(userstate['username'])} поинтов`))
			else{
				if (splitted_command[1]=='top') client.say(channel,`Текущий топ по поинтам: ${get_points_top5()}`)
			}	
			break	
		case 'roulette':
			if (splitted_command.length==1)
				if (get_points_viewer(userstate['username'])>=5) roll_viewer(client,channel,userstate['display-name'],5,2)
				else uf.reply(channel,userstate,client,set_Elv('Не хватает поинтов'))
			else{
				let points = Number(splitted_command[1]) ? Number(splitted_command[1]) : 5
				let chance = (splitted_command.length>2 && Number(splitted_command[2])) ? Number(splitted_command[2]) : 2
				if (points<1 || chance<1) {
					uf.reply(channel,userstate,client,set_Elv('Неее. Это так не работает'))
					return
				}
				if (get_points_viewer(userstate['username'])>=points) roll_viewer(client,channel,userstate['display-name'],points,chance)
				else uf.reply(channel,userstate,client,set_Elv('Не хватает поинтов'))
			}
			break		
		default:
			uf.reply(channel,userstate,client,'нет такой команды');
			break;
	}
	isElv = false;
}

//database with custom user points
function setup_db(client){
	db.exec('create table if not exists points (nickname varchar(50), count smallint)')
	client.on('join',(channel,username)=>current_viewers.push(username))
	client.on('part',(channel,username)=>current_viewers = uf.removeByValue(current_viewers,username))
	console.log(get_points_viewer('wmuga'))
	setInterval(update_viewers,120000)
}

function get_points_viewer(nickname){
	let points = db.prepare(`select * from points where nickname = \'${nickname}\'`).get()
	return points ? points.count : 0
}

function get_points_all(){
	db.prepare(`select * from points`).all().forEach((row)=>{
		console.log(`${row.nickname} = ${row.count}`)
	})
}

function get_points_top5(){
	let rows = db.prepare('select * from points order by count desc where nickname<>wmuga limit 5').all()
	rows = rows.map(row => `${row.nickname} = ${row.count}`)
	return rows.join(', ')
}

function set_points_viewer(nickname,count){
	if (get_points_viewer(nickname)==0){
		db.prepare(`insert into points (nickname, count) values (?, ?)`).run(nickname,count)
	}else{
		db.prepare('update points set count = ? where nickname = ?').run(count,nickname)
	}
}

function add_points_viewer(nickname,count){
	set_points_viewer(nickname,get_points_viewer(nickname)+count)
}

function update_viewers(){
	current_viewers.forEach((nickname)=>{
		add_points_viewer(nickname,1)
	})
}

function roll_viewer(client,channel,username,points,chance){
	if ( Math.random() < 1/chance ){
		client.say(channel,`@${username} смог выиграть в руллетке 1к${chance} и выиграл ${chance*points} поинтов`)
		add_points_viewer(username.toLowerCase(),points*(chance-1))
	}
	else{
		client.say(channel,`@${username} не смог выиграть в руллетке 1к${chance} и теряет ${points} поинтов`)
		add_points_viewer(username.toLowerCase(),-points)
	}
}

module.exports.messageHandler = messageHandler;
module.exports.getmessage = getmessage;

module.exports.resolve_music_requests = resolve_music_requests
module.exports.set_token_updater = function(){
	spoty.set_token_updater()
}

module.exports.play_alarm = ()=>{
	Audio.play(soundboard['alarm'],0.5)
}

module.exports.pass_chat_data = (chat_data)=>{
	socket.emit('chat',chat_data)
}

module.exports.isReq = isReq

module.exports.setup_db = setup_db
module.exports.set_points_viewer = set_points_viewer
module.exports.get_points_all = get_points_all