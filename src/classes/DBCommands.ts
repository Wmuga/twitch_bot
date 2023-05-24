export class DBCommands{
  static create_table = 'create table if not exists points (nickname varchar(50), count smallint)';
  static get_points_viewer = 'select count from points where nickname = ?'
  static get_points_viewer_max20 = 'select * from points order by count desc limit 20'
  static get_points_top = 'select * from points where nickname <> ? order by count desc limit 5'
  static insert_points_viewer = 'insert into points (nickname, count) values (?, ?)';
  static set_points_viewer = 'update points set count = ? where nickname = ?';
  static add_points_viewer = 'update points set count = count + ? where nickname = ?';
}