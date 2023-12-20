export interface IDIContainer{
  addTransient<I>(key:string, obj:I):boolean;
  addSingleton<I>(key:string, obj:I):boolean;
  get<I>(key:string):I | undefined;
}