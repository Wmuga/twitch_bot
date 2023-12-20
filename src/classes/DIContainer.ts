import { IDIContainer } from "../interfaces/IDContainer";

enum DependencyType {
  Singleton,
  Trasnient
}

class DIContainer implements IDIContainer{
  private _sContainer:Record<string, object> = {};
  private _depTypeContainer:Record<string, DependencyType> = {};

  addTransient<I>(key:string, obj:I): boolean {
    throw Error('Not implemented');
    if (key in this._depTypeContainer) return false;

    this._depTypeContainer[key] = DependencyType.Trasnient;

    return true;
  }

  addSingleton<I>(key:string, obj:I): boolean {
    if (key in this._depTypeContainer) return false;

    this._depTypeContainer[key] = DependencyType.Singleton;
    this._sContainer[key] = obj as object

    return true
  }

  get<I>(key:string): I | undefined{
    if (!(key in this._depTypeContainer)) return undefined

    if (this._depTypeContainer[key] == DependencyType.Singleton){
      return this._sContainer[key] as I;
    }

    throw Error('Not implemented');
  }
}

let cont = new DIContainer();

export const Container = cont;