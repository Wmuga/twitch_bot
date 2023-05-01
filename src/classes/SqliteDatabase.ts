import sqlite, {Database} from 'better-sqlite3'
import { IDatabaseModule } from '../interfaces/IDatabaseModule'
import path from 'path'; 
import { DBCommands } from './DBCommands';
import { DBResultPointsCount, DBResultPointsTop } from '../Types/DBResultTypes';

export class SqliteDatabase implements IDatabaseModule{
  _db:Database;

  constructor(){
    const dbPath = path.join(process.cwd(),'viewers.db')
    const backupName = `viewers_${Date.now()}.db`
    const dbBackupPath = path.join(process.cwd(),'backups', backupName)
    this._db = new sqlite(dbPath);
    this._db.exec(DBCommands.create_table);
    this._db.backup(dbBackupPath)
      .then(()    =>console.log('Создан бекап:', backupName))
      .catch((err)=>console.log('Не удалось создать бекап: ', err));
  }

  getPointsViewer(username: string): number {
    let points = this._db.prepare(DBCommands.get_points_viewer)
      .get(username) as DBResultPointsCount
    return points?.count as number ?? -1;
  }

  getPointsTop5(channel_owner: string): Record<string, number> {
    let points = this._db.prepare(DBCommands.get_points_viewer).all(channel_owner) as DBResultPointsTop;
    let res: Record<string,number> = {};
    for(let rec of points){
      res[rec.nickname] = rec.count;
    }
    return res;
  }
  
  setPointsViewer(username: string, points: number): void {
    if(this.getPointsViewer(username)==-1){
      this._db.prepare(DBCommands.insert_points_viewer).run(username, points)
      return;
    }
    this._db.prepare(DBCommands.set_points_viewer).run(points, username)
  }
  
  addPointsViewer(username: string, add: number): void {
    if(this.getPointsViewer(username)==-1){
      this._db.prepare(DBCommands.insert_points_viewer).run(username, add)
      return;
    }
    this._db.prepare(DBCommands.add_points_viewer).run(add, username)
  }

  massAddPoints(usernames: Set<string>, add: number): void {
    const insert_stmt = this._db.prepare(DBCommands.insert_points_viewer);
    const add_stmt = this._db.prepare(DBCommands.add_points_viewer);
    const transaction = this._db.transaction((usernames:Set<string>)=>{
      for(let username of usernames){
        if (this.getPointsViewer(username)==-1){
          insert_stmt.run(username, add);
          continue;
        }
        add_stmt.run(add, username);
      }
    });
    transaction(usernames);
  }

  tryRemovePoints(username: string, points: number): boolean {
    if(this.getPointsViewer(username)>=points){
      this.addPointsViewer(username,-points);
      return true;
    }
    return false;
  }

}