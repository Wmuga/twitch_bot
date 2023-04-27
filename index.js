const tmi = require('tmi.js');
const opt = require('./bot_options.json')
const io = require('socket.io-client')
const Audio = require("sound-play")
const fs = require('fs')
const readline = require('readline');
const {SpotifyMusic} = require('./spotify_module.js')
const {YoutubeMusic} = require('./youtube_music.js')
const {ViewersDB} = require('./db_module.js')
const concomands = require('./concomands.js')
const uf = require('./usefull_functions.js')

class Bot{
    constructor(){
        this.socket = io('http://192.168.1.3:3001', { transports : ['websocket'] })
        this.viewers = []
        this.current_viewers = []
        this.used_soundboard = false
        this.passed_messages++
        this.set_timer = false
        this.client = new tmi.Client({
            options: {
                debug:false,
            },
            connection: {
                reconnect: true,
            },
            identity: {
                username: opt.bot_name,
                password: opt.oauth,
            },
            channels: [opt.channel],
        })

        this.client.on('connected',(address,port) =>{
            console.log("Successfully connected client");
        })

        this.client.on('join',(channel,username)=>this.current_viewers.push(username))
	    this.client.on('part',(channel,username)=>this.current_viewers = uf.removeByValue(current_viewers,username))
        this.client.addListener('message',(channel,userstate,message,self)=>this.message_handler(userstate,message,self))
        this.client.connect()

        this.spoty = new SpotifyMusic(opt.spotify_client_id,opt.spotify_client_secret,opt.device_id)
        this.spoty.set_token_updater()

        this.ytm = new YoutubeMusic({"api_key":opt.youtube_api_key})
        this.ytm.setup_resolve_requests()

        this.db = new ViewersDB() 

        this.coninput = readline.createInterface({
            input:process.stdin,
            output:process.stdout
        });

        this.coninput.on('line', (input) =>{
            let response = concomands.handler(input);
            console.log(response);
            if (response){
                switch(response[0]){
                    default:
                        break;
                    case 'send':{
                        let sent_channel = '#'+response[1];
                        if (sent_channel !='#wmuga'){
                            this.client.join(sent_channel).then(() => {
                                this.client.say(sent_channel,response[2]);
                                this.client.part(sent_channel);
                            });
                        }
                        else{
                            this.say(response[2]);
                        }
                        break
                    }
                    case 'chat':
                        this.socket.emit('chat',response[1])
                        break
                    case 'db-update':
                        this.db.set_points_viewer(response[1],response[2])
                        break
                    case 'db-get':
                        this.db.get_points_all()
                        break		
                }
            }
        })
        
        setInterval(async ()=>{
            if (this.spoty.is_ready()){
                if (!this.ytm.is_playing() && this.is_autoplay_spoty && ! await this.spoty.is_playing()) this.spoty.resume()
                if (this.ytm.is_playing() && this.spoty.is_playing()) this.spoty.pause()
                
                this.socket.emit('song', (this.ytm.is_playing() ? this.ytm.currently_playing() : this.spoty.currently_playing())??'null')
                
                
                if(!this.set_timer){
                    this.set_timer = true
                    setTimeout(()=>{
                        this.set_timer = false
                        if (this.passed_messages>4){
                            this.current_timer=((this.current_timer??0) +1)%opt.timer_messages.length;
                            this.passed_messages = 0
                            this.say(timer_messages[this.current_timer])
                        }
                    },6*60*1000)
                }
            }
        },1000)
		
		setInterval(()=>{
			this.db.update_viewers(this.current_viewers)
		},60*1000)
    }

    say(message) {
        this.client.say(opt.channel,this.isElv ? uf.switch_layout(message) : message)
        this.isElv = false
    }
    reply(username,message){
        this.say('@' + username+' '+ message)
    }
    moderate(username, message){
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
            console.log(username + " нарвался на бананду за спам");
            this.client.ban(channel,username,'спам');
            return false;
        }
        return true;
    }

    test_for_new_viewer(username){
        if (!this.viewers.includes(username.toLowerCase())){
            this.viewers.push(username.toLowerCase());
            this.socket.emit('viewer',username in opt.custom_greetings ?? "Приветствую, @"+ username)
        }
    }

    message_handler(userstate, message, self)
    {	
        if (!self){
            if (this.moderate(userstate['username'], message)){
                this.test_for_new_viewer(userstate['username']);
                if (message[0]=='!') 
                    this.command_handler(userstate,message.slice(1));
                }
        }
    }

    check_rights(userstate,owner_only){
        return (!owner_only && userstate["mod"]) || userstate['username'] == opt.channel
    }

    async command_handler(userstate,command){
        let username = userstate['display-name']
        let splitted_command = command.toLowerCase().split(' ').filter(part => part.length>0);
        if (splitted_command[0][0]>'z') {
            this.isElv = true;
            splitted_command =  splitted_command.map(s => uf.switch_layout(s))
        }
        switch(splitted_command[0])
	    {
            case 'help':
                this.reply(username,'Хелпа с командами в доках: '+ 'https://docs.google.com/spreadsheets/d/1jwL1IHtfxQZlZf__QWsfCIYeDOebPZTViDim7wORgq4/edit?usp=sharing');
                break;
            case 'sound':
            case 's':
                if (splitted_command.length==1) 
                    this.reply(username,'Можно воспроизвести различные звуки: !sound/s *название*. Их посмотреть тут: https://docs.google.com/spreadsheets/d/12SQum-pyn170L1vffYvdLqGcLZIU7ndGKwJiGdnkkQ4/edit?usp=sharing');
                else{
                    let path = __dirname+'\\soundboard\\'+splitted_command[1];
                    if (!this.used_soundboard){
                        if (fs.existsSync(path))
                        {
                            if (splitted_command[1]=='ugu') {
                                this.client.color('DodgerBlue');
                                this.say('Ууугу');
                            }
                            Audio.play(path,0.7);
                            this.used_soundboard=true;
                            setTimeout(() =>{ used_soundboard = false},8000);
                            if (splitted_command[1]=='ugu') client.color('OrangeRed');
                        }
                        else
                            this.reply(username,'нет такого звука');
                    }
                }
            break;    
            case 'sr-start':
                if (this.check_rights(userstate,true)) {
					this.isReq = true;
					this.say('Включены запросы музыки')
					this.is_autoplay_spoty = true
				}
				else this.reply(username,'Не трожь кнопку')
                break;
		    case 'sr-stop':
            case 'sr-close':
		    case 'sr-end':	
                if (this.check_rights(userstate,true)) {
		    		this.isReq = false;
		    		this.say('Выключены запросы музыки')
		    		this.ytm.stop()
                    this.ytm.clear_queue()
		    		this.spoty.pause()
		    		this.is_autoplay_spoty = false
		    		this.socket.emit('song','null')
		    	}
		    	else this.reply(username,'Не трожь кнопку')
                break;    
            case 'sr':
		    	if (splitted_command.length==1)
		    		this.reply(username,'Можно заказать музыку. !sr *название трека* / *ссылка на ютуб*')
		    	else{
		    		if (this.isReq || this.check_rights(userstate,true)){
		    			let data = splitted_command.splice(1).join(" ")
                        if (this.check_rights(userstate,true) || this.db.execute_with_points(username,5)){
		    			    let res = await this.ytm.add_to_queue(username,userstate["mod"]? 1 : this.check_rights(userstate,true) ? 2 : 0, data)
                            this.say(res[0])
                            if (!res[1]) this.db.add_points_viewer(username,5)
                        } else this.reply(username,`Недостаточно поинтов. Необходимо 5`)
		    		}else{
		    			this.reply(username,'Пока нельзя')
		    		}
		    	}
                break;
		    case 'sr-skip':
		    	if (this.check_rights(userstate,false)) {
		    		if (this.ytm.is_playing()) {
		    			console.log('Skipped yt request')
		    			this.ytm.stop()
		    		}
		    		else{ 
		    			console.log('Skipped spotify track')
		    			this.spoty.skip()
		    		}
		    		this.socket.emit('song','null')
		    	}else this.reply(username,'Не трожь кнопку')
		    	break;
		    case 'sr-volume':
		    	if (this.check_rights(userstate,false)) {
		    		if (splitted_command.length>1)
		    			this.ytm.change_volume(parseFloat(splitted_command[1]))
		    	}
		    	else this.reply(username,'Не трожь кнопку')
		    	break;	
            
		    case 'roll':
		    	if (splitted_command.length==1)
		    		this.reply(username,'!roll *кол-во кубов*d*макс значение куба*')
		    	else{
		    		let data = splitted_command[1].split('d')
		    		let count = Number(data[0])
		    		let max = data.length>1 ? Number(data[1]) : 6
		    		let l = []
		    		for (let i=0;i<count;i++) l.push(Math.floor(Math.random()*max)+1)
		    		this.say(`${channel,l.join(' + ')} = ${l.reduce((a, b) => a + b, 0)}`)	
		    	}	
		    	break
		    case 'points':
		    	if (splitted_command.length==1 || splitted_command[1]!='top')
		    		this.reply(username,`У тебя ${this.db.get_points_viewer(userstate['username'])} поинтов`)
		    	else{
		    		if (splitted_command[1]=='top') this.say(`Текущий топ по поинтам: ${this.db.get_points_top5()}`)
		    	}	
		    	break	
		    case 'roulette':
		    	if (splitted_command.length==1)
		    		if (this.db.execute_with_points(username,5)) this.db.roll_viewer(username,5,2)
		    		else this.reply(username,`Недостаточно поинтов. Необходимо 5`)
		    	else{
		    		let points = Number(splitted_command[1]) || 5
		    		let chance = (splitted_command.length>2 && Number(splitted_command[2])) ? Number(splitted_command[2]) : 2
		    		if (points<1 || chance<1) {
		    			this.reply(username,'Неее. Это так не работает')
		    			return
		    		}
		    		if (this.db.execute_with_points(username,points)) roll_viewer(username,points,chance)
		    		else this.reply(username,`Недостаточно поинтов. Необходимо ${points}`)
		    	}
		    	break	
		    default:
		    	this.reply(username,'нет такой команды');
		    	break;
        }
    }
}

let bot = new Bot()