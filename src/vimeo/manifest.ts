import ProgressBar from 'jsr:@deno-library/progress';
import { Client } from './client.ts';

export interface Segment {
    url: string;
}

export interface IContent {
    id: string;
    base_url: string;
    bitrate: number;
    init_segment: string;
    segments: Segment[];
}

export class Content implements IContent {
    id: string;
    base_url: string;
    bitrate: number;
    init_segment: string;
    segments: Segment[];

    #manifestURL: URL;

    constructor(content: IContent, manifestURL: URL) {
        this.id = content.id;
        this.base_url = content.base_url;
        this.bitrate = content.bitrate;
        this.init_segment = content.init_segment;
        this.segments = content.segments;

        this.#manifestURL = manifestURL;
    }

    get decodedInitSegment() {
        const decodedString = atob(this.init_segment);

        // Convert the decoded string to a Uint8Array (byte array)
        const decodedBytes = new Uint8Array(decodedString.length);

        for (let i = 0; i < decodedString.length; i++) {
            decodedBytes[i] = decodedString.charCodeAt(i);
        }

        return decodedBytes;
    }

    /** Resolve the URL for all segments in given content */
    get resolvedSegmentURLs(): URL[] {
        return this.segments.map((segment) =>
            new URL(segment.url, new URL(this.base_url, this.#manifestURL))
        );
    }
}

export interface IMainfest {
    clip_id: string;
    base_url: string;
    video: IContent[];
    audio: IContent[];
}

export class Mainfest implements IMainfest {
    clip_id: string;
    base_url: string;
    video: Content[];
    audio: Content[];

    constructor(manifest: IMainfest, masterJsonURL: URL) {
        this.clip_id = manifest.clip_id;
        this.base_url = manifest.base_url;

        let resolvedBaseURL = new URL(this.base_url, masterJsonURL);
        this.video = manifest.video.map((video) => new Content(video, resolvedBaseURL));
        this.audio = manifest.audio.map((audio) => new Content(audio, resolvedBaseURL));
    }

    #idComparator(id: string) {
        return function (content: Content) {
            return content.id === id;
        };
    }

    findVideo(id: string): Content | undefined {
        return this.video.find(this.#idComparator(id));
    }

    findAudio(id: string): Content | undefined {
        return this.audio.find(this.#idComparator(id));
    }

    #bitrateReducer(maxContent: Content, currentContent: Content) {
        return currentContent.bitrate > maxContent.bitrate ? currentContent : maxContent;
    }

    findMaximumBitrateVideo(): Content {
        return this.video.reduce(this.#bitrateReducer, this.video[0] || null);
    }

    findMaximumBitrateAudio(): Content {
        return this.audio.reduce(this.#bitrateReducer, this.audio[0] || null);
    }

    async #createFile(
        content: Content,
        writable: WritableStream<Uint8Array>,
        client: Client,
    ) {
        let writer = writable.getWriter();
        await writer.ready;
        await writer.write(content.decodedInitSegment);
        writer.releaseLock();

        let segmentURLs = content.resolvedSegmentURLs;

        const progress = new ProgressBar({
            title: 'Starting download...',
            total: segmentURLs.length - 1,
        });

        for (let index = 0; index < segmentURLs.length; index++) {
            let segmentURL = segmentURLs[index];
            await client.download(segmentURL, writable);
            let id = segmentURL.search.match(/[?&]range=(\d+-\d+)/)?.[1];
            await progress.render(index, { title: `Downloading segment id: ${id}` });
        }

        writable.close();
    }

    async createVideoFile(
        writable: WritableStream<Uint8Array>,
        id: string,
        client: Client,
    ): Promise<void> {
        let video = this.findVideo(id);
        if (!video) throw new Error(`Video with ID ${id} not found`);
        await this.#createFile(video, writable, client);
    }

    async createAudioFile(
        writable: WritableStream<Uint8Array>,
        id: string,
        client: Client,
    ): Promise<void> {
        let audio = this.findAudio(id);
        if (!audio) throw new Error(`Audio with ID ${id} not found`);
        await this.#createFile(audio, writable, client);
    }
}
