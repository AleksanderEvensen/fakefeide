import { createIsomorphicFn } from "@tanstack/react-start";
import {
	deleteCookie as tsr_deleteCookie,
	getCookie as tsr_getCookie,
	setCookie as tsr_setCookie,
} from "@tanstack/react-start/server";
import Cookies from "universal-cookie";

const cookies = new Cookies();

const DEFAULT_DURATION = 3600 * 1000 * 24 * 30;

type BaseOptions = {
	path?: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: "lax" | "strict" | "none" | boolean;
};

const cookieOptions = (duration: number, extra: BaseOptions = {}) => ({
	path: "/",
	expires: new Date(Date.now() + duration),
	...extra,
});

export const getCookie: (key: string) => string | undefined = createIsomorphicFn()
	.client((key: string) => cookies.get(key))
	.server((key: string) => tsr_getCookie(key));

export const setCookie: (key: string, value: string, duration?: number, extra?: BaseOptions) => void = createIsomorphicFn()
	.client((key: string, value: string, duration = DEFAULT_DURATION, extra: BaseOptions = {}) =>
		cookies.set(key, value, cookieOptions(duration, extra) as never),
	)
	.server((key: string, value: string, duration = DEFAULT_DURATION, extra: BaseOptions = {}) =>
		tsr_setCookie(key, value, cookieOptions(duration, extra)),
	);

export const removeCookie: (key: string) => void = createIsomorphicFn()
	.client((key: string) => cookies.remove(key, { path: "/" }))
	.server((key: string) => tsr_deleteCookie(key, { path: "/" }));
