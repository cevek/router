export interface PathPart {
    paramName: string | undefined;
    value: string;
    prefix: string;
    isOptional: boolean;
}

export interface UrlParams<T = {}> {
    url: string;
    pathParams: { [key: string]: string };
    pathValues: string[];
    searchParams: { [key: string]: string };
    searchValues: string[];
    params: { [key: string]: string };
    values: string[];
    hash: string;
}

export class Path {
    regexp: RegExp;
    parts: PathPart[];
    paramsKeys: string[] = [];
    searchKeys: string[] = [];
    regexpGroupNames: string[];
    isExact: boolean;
    originalPattern: string;
    pattern: string;

    constructor(pattern: string, params: { [key: string]: string } | undefined, isExact: boolean) {
        this.pattern = this.normalize(pattern);
        this.isExact = isExact;
        this.originalPattern = pattern;
        const { groupNames, pathParts, regexp } = this.compile(this.pattern, isExact);
        this.regexpGroupNames = groupNames;
        this.parts = pathParts;
        this.regexp = regexp;
        if (params !== void 0) {
            const keys = Object.keys(params);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (typeof params[key] === 'string') {
                    this.searchKeys.push(key);
                } else {
                    this.paramsKeys.push(key);
                }
            }
        }
    }

    private parsePath(path: string) {
        const m = path.match(this.regexp);
        if (m === null) return { pathParams: void 0, pathValues: [] };
        const pathParams: { [name: string]: string } = {};
        const pathValues: string[] = [];
        for (let i = 1; i < m.length; i++) {
            const value = decodeURIComponent(m[i] || '');
            pathParams[this.regexpGroupNames[i]] = value;
            pathValues.push(value);
        }
        return { pathParams, pathValues };
    }

    private parseSearch(search: string) {
        if (search === void 0) return { searchParams: {}, searchValues: [] };
        const re = /(.*?)=(.*?)(&|$)/g;
        let m;
        const searchParams: { [key: string]: string } = {};
        const searchValues: string[] = [];
        while ((m = re.exec(search))) {
            const key = decodeURIComponent(m[1]);
            const value = decodeURIComponent(m[2]);
            const pos = this.searchKeys.indexOf(key);
            if (pos > -1) {
                searchValues[pos] = value;
                searchParams[key] = value;
            }
        }
        return { searchParams, searchValues };
    }

    parse(url: string): UrlParams | undefined {
        const [_, path, search, hash] = url.match(/^(.*?)(?:\?(.*?))?(?:\#(.*?))?$/) || ['', '', '', ''];
        const { pathParams, pathValues } = this.parsePath(path);
        if (pathParams === void 0) {
            return void 0;
        }
        const { searchParams, searchValues } = this.parseSearch(search);
        return {
            url,
            pathParams,
            pathValues,
            searchParams,
            searchValues,
            params: { ...pathParams, ...searchParams, hash },
            values: [...pathValues, ...searchValues, hash],
            hash,
        };
    }

    compile(pattern: string, isExact: boolean) {
        const groupNames = ['all'];
        const re = /((?:\/?[^/:]*)?:[\w\d_]+(?:\\\?)?)/;
        const splitParts = escapeRegExp(pattern).split(re);
        const pathParts: PathPart[] = [];
        let regexpStr = '^';
        for (let i = 0; i < splitParts.length; i++) {
            const part = splitParts[i];
            const m = part.match(/^(\/?[^/:]*)?:([\w\d_]+)(\\\?)?$/);
            if (m) {
                const isOptional = !!m[3];
                const prefix = m[1] || '';
                const groupName = unEscapeRegExp(m[2]);

                groupNames.push(groupName);
                regexpStr += `(?:${prefix}([^/]+))` + (isOptional ? '?' : '');
                pathParts.push({
                    paramName: groupName,
                    value: '',
                    prefix: unEscapeRegExp(prefix),
                    isOptional,
                });
            } else if (part !== '') {
                pathParts.push({
                    paramName: void 0,
                    value: unEscapeRegExp(part),
                    prefix: '',
                    isOptional: false,
                });
                regexpStr += part;
            }
        }
        regexpStr += '/?';
        if (isExact) {
            regexpStr += '$';
        }
        return {
            pathParts,
            regexp: new RegExp(regexpStr),
            groupNames,
        };
    }

    toUrl(params: { [name: string]: string | number }) {
        let url = '';
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            if (part.paramName !== void 0) {
                const paramValue = params[part.paramName];
                if ((typeof paramValue !== 'string' && typeof paramValue !== 'number') || paramValue === '') {
                    if (!part.isOptional) {
                        throw new Error(`Empty url param value for ${part.paramName}`);
                    }
                } else {
                    url += part.prefix + encodeURIComponent(paramValue + '');
                }
            } else {
                url += part.value;
            }
        }
        let search = '';
        for (let i = 0; i < this.searchKeys.length; i++) {
            const key = this.searchKeys[i];
            const value = params[key];
            if (typeof value === 'string' || typeof value === 'number') {
                search += (search === '' ? '?' : '&') + key + '=' + encodeURIComponent(value + '');
            }
        }
        if (url === '') url = '/';
        url = url + search;
        if (typeof params.hash === 'string') {
            url += '#' + params.hash;
        }
        return url;
    }

    getPathParamsCount() {
        return this.regexpGroupNames.length - 1;
    }
    getAllParamsCount() {
        return this.getPathParamsCount() + this.searchKeys.length;
    }

    normalize(pathStr: string) {
        return ('/' + pathStr).replace(/\/+/g, '/').replace(/\/+$/, '');
    }
}

function escapeRegExp(text: string) {
    return text.replace(/[\-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function unEscapeRegExp(text: string) {
    return text.replace(/\\([\-\[\]{}()*+?.,\\^$|#\s])/g, '$1');
}
