import { PublicRoute } from "./Route";
import { Router } from "./Router";

export type Omit<T, K> = Pick<T, { [P in keyof T]: P extends K ? never : P; }[keyof T]>;
export type Diff<A, B> = { [P in Extract<keyof A, keyof B>]?: string } & { [P in Exclude<keyof B, keyof A>]: string };
export type RouteType<T> = T extends {params: infer R} ? R : {};

export type ConvertToRoute<Json, ParentParams, OmitProps> = {
    [P in keyof Omit<Json, OmitProps>]: 
        P extends 'component' 
            ? Record<keyof Json[P], React.ComponentClass<{}>> 
            : ConvertToRoute<Json[P], RouteType<Json> & ParentParams, OmitProps>
} & PublicRoute<RouteType<Json> & ParentParams>

export type RouteProps<T> = T extends PublicRoute<infer R> ? Router<R> : {};
export type Force<T> = T;

export type Any = any;