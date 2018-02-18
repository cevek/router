import { PublicRoute, InnerRoute } from "./Route";
import { Router, PublicRouter } from "./Router";

export type Omit<T, K> = Pick<T, { [P in keyof T]: P extends K ? never : P; }[keyof T]>;
export type Diff<A, B> = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
// export type RouteType<T> = T extends {params: infer R; searchParams?: infer S} ? (R & Partial<S>) : {};
export type RouteType<T> = T extends {params: infer R; } ? ParamsOpt<R> : {};

export type ConvertToRoute<Json, ParentParams, OmitProps> = {
    [P in keyof Omit<Json, OmitProps>]: 
        // P extends 'resolve' ? Json[P] :
        P extends 'component' 
            ? Record<keyof Json[P], React.ComponentClass<{}>> 
            : ConvertToRoute<Json[P], RouteType<Json> & ParentParams, OmitProps>
} & PublicRoute<RouteType<Json> & ParentParams>

export type RouteProps<T> = T extends PublicRoute<infer R> ? Router<R> : {};

export type FilterKeysByValue<T, Value> = {[P in keyof T]: T[P] extends Value ? P : never }[keyof T];
export type ParamsOpt<T> = {[P in FilterKeysByValue<T, number>]: string} & {[P in FilterKeysByValue<T, string>]?: string};
export type RouteParentPromise<T> = T extends {resolve(): infer R} ? R : T extends {resolve(): Promise<infer R>} ? R : never;
export type Any = any; 