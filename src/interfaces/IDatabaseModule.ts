export interface IDatabaseModule{
  setPointsViewer(username:string, points:number):void;
  getPointsViewer(username:string):number;
  getPointsTop5(channel_owner: string):Record<string, number>;
  addPointsViewer(username:string, add:number):void;
  massAddPoints(usernames:Set<string>, add:number):void;
  tryRemovePoints(username:string, points:number):boolean;
}