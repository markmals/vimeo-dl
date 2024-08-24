import { METHOD } from '@std/http';
import config from '../../deno.json' with { type: 'json' };
import { IMainfest, Mainfest } from './manifest.ts';

export class Client {
    #masterJsonURL: URL;
    #userAgent: string;

    constructor(masterJsonURL: URL, userAgent?: string | undefined) {
        this.#masterJsonURL = masterJsonURL;
        this.#userAgent = userAgent ?? `vimeo-dl/${config.version}`;
    }

    async #get(url: URL): Promise<Response> {
        let response = await fetch(url, {
            method: METHOD.Get,
            headers: { 'User-Agent': this.#userAgent },
        });

        if (!response.ok) {
            throw new Error(
                `Response code from ${url.hostname}: ${response.status} (${response.statusText})`,
                { cause: response.status },
            );
        }

        return response;
    }

    async getManifest(): Promise<Mainfest> {
        let manifest = await this.#get(this.#masterJsonURL).then<IMainfest>((r) => r.json());
        return new Mainfest(manifest, this.#masterJsonURL);
    }

    async download(url: URL, writable: WritableStream<Uint8Array>) {
        let response = await this.#get(url);
        await response.body!.pipeTo(writable, { preventClose: true });
    }
}
