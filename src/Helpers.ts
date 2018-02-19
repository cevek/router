import { PublicRoute, InnerRoute, ResolveParam } from "./Route";
import { Router, PublicRouter } from "./Router";

export type Diff<A, B> = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
export type RouteType<T> = T extends {params: infer R; } ? ParamsOpt<R> : {};
export type RouteResolve<T> = Promise<T extends {resolve: (...args: any[])=>Promise<infer R>; } ? R : T extends {resolve: (...args: any[])=>infer R} ? R : never>;

export type Route<Json, ParentParams, ParentResolve, Store, LocalStore> = 
    PublicRoute<Norm<RouteType<Json> & ParentParams>, ParentResolve, Store, LocalStore>
    & (Json extends {children: any}
        ? { [P in keyof Json["children"]]: Route<Json["children"][P], RouteType<Json> & ParentParams, RouteResolve<Json>, Store, LocalStore> }
        : {})

export type ResolveProps<T> = T extends PublicRoute<infer Params, infer ParentResolve, infer Store, infer LocalStore> ? ResolveParam<Params, Store, LocalStore, ParentResolve> : {};
export type RouteProps<T> = T extends PublicRoute<infer Params, infer ParentResolve> ? PublicRouter<Params> : {};
export type GetRouteParam<T> = T extends PublicRoute<infer Params> ? Params : {};

export type FilterKeysByValue<T, Value> = {[P in keyof T]: T[P] extends Value ? P : never }[keyof T];
export type ParamsOpt<T> = {[P in FilterKeysByValue<T, number>]: string} & {[P in FilterKeysByValue<T, string>]?: string};
// export type RouteParentPromise<T> = T extends PublicRoute<infer X, infer R> ? PromiseReturnValue<R> : never;
export type Any = any; 

export type Norm<T> = {[P in keyof T]: T[P]};
