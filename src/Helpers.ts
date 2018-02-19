import { PublicRoute, InnerRoute, ResolveParam } from "./Route";
import { Router, PublicRouter } from "./Router";

export type Omit<T, K> = Pick<T, { [P in keyof T]: P extends K ? never : P; }[keyof T]>;
export type Diff<A, B> = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
// export type RouteType<T> = T extends {params: infer R; searchParams?: infer S} ? (R & Partial<S>) : {};
export type PromiseReturnValue<T> = T extends (...args: any[]) => Promise<infer R> ? Promise<R> : T extends (...args: any[]) => infer R ? Promise<R> : never;
export type RouteType<T> = T extends {params: infer R; } ? ParamsOpt<R> : {};
export type RouteResolve<T> = T extends {resolve: infer R; } ? R : never;

export type ConvertToRoute<Json, ParentParams, ParentResolve, Store, LocalStore, OmitProps> = {
    [P in keyof Omit<Json, OmitProps>]: 
        // P extends 'resolve' ? Json[P] :
        P extends 'component' 
            ? Record<keyof Json[P], React.ComponentClass<{}>>
            : ConvertToRoute<Json[P], RouteType<Json> & ParentParams, RouteResolve<Json>, Store, LocalStore, OmitProps>
} & PublicRoute<RouteType<Json> & ParentParams, ParentResolve, Store, LocalStore>

export type ResolveProps<T> = T extends PublicRoute<infer Params, infer ParentResolve, infer Store, infer LocalStore> ? ResolveParam<Params, Store, LocalStore, PromiseReturnValue<ParentResolve>> : {};
export type RouteProps<T> = T extends PublicRoute<infer Params, infer ParentResolve> ? Router<Params> : {};

export type FilterKeysByValue<T, Value> = {[P in keyof T]: T[P] extends Value ? P : never }[keyof T];
export type ParamsOpt<T> = {[P in FilterKeysByValue<T, number>]: string} & {[P in FilterKeysByValue<T, string>]?: string};
// export type RouteParentPromise<T> = T extends PublicRoute<infer X, infer R> ? PromiseReturnValue<R> : never;
export type Any = any; 