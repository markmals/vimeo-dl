import { Client, Mainfest } from '../mod.ts';

interface Options {
    input: string;
    userAgent?: string;
    videoId?: string;
    audioId?: string;
    output?: string;
    combine: boolean;
}

type ContentType = 'video' | 'audio';

class Downloader {
    #options: Options;
    #client: Client;
    #manifest: Mainfest;
    #outputFilename: string;

    get #videoFileName() {
        return `${this.#outputFilename}-video.m4v`;
    }

    get #audioFileName() {
        return `${this.#outputFilename}-audio.m4a`;
    }

    get #combinedFileName() {
        return `${this.#outputFilename}.mp4`;
    }

    constructor(options: Options, client: Client, manifest: Mainfest) {
        this.#options = options;
        this.#client = client;
        this.#manifest = manifest;
        this.#outputFilename = options.output ? options.output : manifest.clip_id;
    }

    async #createFile(type: ContentType): Promise<Deno.FsFile> {
        return await Deno.open(type === 'video' ? this.#videoFileName : this.#audioFileName, {
            create: true,
            write: true,
            mode: 0o644,
        });
    }

    async downloadVideoFile() {
        let videoFile = await this.#createFile('video');
        console.log(`\nDownloading Video to ${this.#videoFileName}`);
        let videoId = this.#options.videoId ?? this.#manifest.findMaximumBitrateVideo().id;
        await this.#manifest.createVideoFile(videoFile.writable, videoId, this.#client);
    }

    async downloadAudioFile() {
        let audioFile = await this.#createFile('audio');
        console.log(`\nDownloading Audio to ${this.#audioFileName}`);
        let audioId = this.#options.audioId ?? this.#manifest.findMaximumBitrateAudio().id;
        await this.#manifest.createAudioFile(audioFile.writable, audioId, this.#client);
    }

    async combineVideoAndAudioFiles() {
        let ffmpeg = await new Deno.Command('ffmpeg', {
            // deno-fmt-ignore
            args: [
                '-i', this.#videoFileName,
                '-i', this.#audioFileName,
                '-c', 'copy',
                this.#combinedFileName,
            ],
        }).output();

        let ffmpegConsoleOutput = new TextDecoder().decode(ffmpeg.stderr);
        if (ffmpegConsoleOutput.toLowerCase().includes('error')) {
            throw new Error(ffmpegConsoleOutput);
        }

        await Deno.remove(this.#videoFileName);
        await Deno.remove(this.#audioFileName);
    }
}

export async function main(options: Options) {
    let client = new Client(new URL(options.input), options.userAgent);
    let manifest = await client.getManifest();
    let downloader = new Downloader(options, client, manifest);

    try {
        await downloader.downloadVideoFile();
    } catch (error) {
        console.error(`${error}\n`);
        let masterJsonURL = new URL(options.input);
        masterJsonURL.searchParams.append('base64_init', '1');
        masterJsonURL.searchParams.delete('query_string_ranges');
        console.log(`Try this url: ${masterJsonURL}`);
        Deno.exit(1);
    }

    if (manifest.audio.length > 0) {
        await downloader.downloadAudioFile();
        if (options.combine) {
            await downloader.combineVideoAndAudioFiles();
        }
    }

    console.log('\nDone!');
}
