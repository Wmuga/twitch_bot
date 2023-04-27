const sqlite = require('better-sqlite3')
class ViewersDB{
  constructor(){
    this.db = new sqlite(`${__dirname}\\viewers.db`)
    this.db.exec('create table if not exists points (nickname varchar(50), count smallint)')
  }
  get_points_viewer(nickname){
    let points = this.db.prepare(`select * from points where nickname = \'${nickname}\'`).get()
    return points ? points.count : 0
  }

  get_points_all(){
    this.db.prepare(`select * from points`).all().forEach((row)=>{
      console.log(`${row.nickname} = ${row.count}`)
    })
  }

  get_points_top5(){
    let rows = this.db.prepare('select * from points order by count desc where nickname<>wmuga limit 5').all()
    rows = rows.map(row => `${row.nickname} = ${row.count}`)
    return rows.join(', ')
  }

  set_points_viewer(nickname,count){
    if (this.get_points_viewer(nickname)==0){
      this.db.prepare(`insert into points (nickname, count) values (?, ?)`).run(nickname,count)
    }else{
      this.db.prepare('update points set count = ? where nickname = ?').run(count,nickname)
    }
  }

  add_points_viewer(nickname,count){
    this.set_points_viewer(nickname,this.get_points_viewer(nickname)+count)
  }
  
  update_viewers(current_viewers){
    current_viewers.forEach((nickname)=>{
      this.add_points_viewer(nickname,1)
    })
  }

  roll_viewer(username,points,chance){
    if ( Math.random() < 1/chance ){
      this.add_points_viewer(username.toLowerCase(),points*(chance-1))
      return ` смог выиграть в руллетке 1к${chance} и выиграл ${chance*points} поинтов`
    }
    else{
      this.add_points_viewer(username.toLowerCase(),-points)
      return ` не смог выиграть в руллетке 1к${chance} и теряет ${points} поинтов`
    }
  }

  execute_with_points(username,points){
    if(this.get_points_viewer(username.toLowerCase())>=points){
      this.add_points_viewer(username.toLowerCase(),-points)
      return true
    }
    return false
  }
}

module.exports.ViewersDB = ViewersDB