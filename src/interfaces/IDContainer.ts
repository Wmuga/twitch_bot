export interface IDIContainer{
  addTransient<I>(key:string):boolean;
  addSingleton<I>(key:string, obj:I):boolean;
  get<I>(key:string):I | undefined;
}