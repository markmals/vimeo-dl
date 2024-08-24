// deno-lint-ignore-file no-explicit-any

import { assertEquals, assertExists } from 'jsr:@std/assert';
import { IMainfest, Mainfest } from './manifest.ts';

function createTestManifest(
    { baseUrl, videos = [], audios = [] }: { baseUrl?: string; videos?: any[]; audios?: any[] },
) {
    return {
        base_url: baseUrl,
        video: [
            { id: '240p', bitrate: 430000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            { id: '360p', bitrate: 750000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            { id: '720p', bitrate: 3325000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            {
                id: '1080p',
                bitrate: 6385000,
                init_segment: 'Zm9vYmFyYmF6cXV4Cg==',
                segments: [
                    { url: '1080p.mp4?range=0-9' },
                    { url: '1080p.mp4?range=10-19' },
                    { url: '1080p.mp4?range=20-29' },
                ],
            },
            ...videos,
        ],
        audio: [
            { id: 'foo', bitrate: 6385000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            { id: 'bar', bitrate: 3325000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            { id: 'baz', bitrate: 750000, init_segment: 'Zm9vYmFyYmF6cXV4Cg==' },
            ...audios,
        ],
    } as IMainfest;
}

Deno.test('manifest', async ({ step }) => {
    let manifestJson = createTestManifest({ baseUrl: '../../../parcel/archive/' });
    let manifestUrl = new URL('https://example.com/foo/bar/baz/qux/master.json');
    let manifest = new Mainfest(manifestJson, manifestUrl);

    await step('video decoded init segment', () => {
        let expected = new TextEncoder().encode('foobarbazqux\x0a'); // LF for RFC2045
        let actual = manifest.findVideo('1080p')?.decodedInitSegment;
        assertEquals(actual, expected);
    });

    await step('find video', () => {
        for (let resolution of ['240p', '360p', '720p', '1080p']) {
            let video = manifest.findVideo(resolution);
            assertExists(video);
        }

        let notFound = manifest.findVideo('notfound');
        assertEquals(notFound, undefined);
    });

    await step('find maximum bitrate video', () => {
        let expected = manifestJson.video[3].id;
        let actual = manifest.findMaximumBitrateVideo().id;
        assertEquals(actual, expected);
    });

    await step('audio decoded init segment', () => {
        let expected = new TextEncoder().encode('foobarbazqux\x0a'); // LF for RFC2045
        let actual = manifest.findAudio('foo')?.decodedInitSegment;
        assertEquals(actual, expected);
    });

    await step('find maximum bitrate audio', () => {
        let expected = manifestJson.audio[0].id;
        let actual = manifest.findMaximumBitrateAudio().id;
        assertEquals(actual, expected);
    });

    await step('video segment urls', () => {
        let expected = [
            new URL('https://example.com/foo/parcel/archive/1080p.mp4?range=0-9'),
            new URL('https://example.com/foo/parcel/archive/1080p.mp4?range=10-19'),
            new URL('https://example.com/foo/parcel/archive/1080p.mp4?range=20-29'),
        ];
        let actual = manifest.video[3].resolvedSegmentURLs;
        assertEquals(actual, expected);
    });

    await step('video segment urls 2', () => {
        let json = createTestManifest({
            baseUrl: '../',
            videos: [{
                id: 'qux',
                base_url: 'qux/chop/',
                segments: [
                    { url: 'segment-1.m4s' },
                    { url: 'segment-2.m4s' },
                    { url: 'segment-3.m4s' },
                ],
            }],
        });

        let url = new URL('https://example.com/foo/bar/video/baz/master.json');
        let m = new Mainfest(json, url);

        let expected = [
            new URL('https://example.com/foo/bar/video/qux/chop/segment-1.m4s'),
            new URL('https://example.com/foo/bar/video/qux/chop/segment-2.m4s'),
            new URL('https://example.com/foo/bar/video/qux/chop/segment-3.m4s'),
        ];
        let actual = m.video[4].resolvedSegmentURLs;
        assertEquals(actual, expected);
    });

    await step('audio segment urls', () => {
        let json = createTestManifest({
            baseUrl: '../',
            audios: [{
                id: 'qux',
                base_url: '../audio/qux/chop/',
                segments: [
                    { url: 'segment-1.m4s' },
                    { url: 'segment-2.m4s' },
                    { url: 'segment-3.m4s' },
                ],
            }],
        });

        let url = new URL('https://example.com/foo/bar/video/baz/master.json');
        let m = new Mainfest(json, url);

        let expected = [
            new URL('https://example.com/foo/bar/audio/qux/chop/segment-1.m4s'),
            new URL('https://example.com/foo/bar/audio/qux/chop/segment-2.m4s'),
            new URL('https://example.com/foo/bar/audio/qux/chop/segment-3.m4s'),
        ];
        let actual = m.audio[3].resolvedSegmentURLs;
        assertEquals(actual, expected);
    });

    await step('create video file', () => {
        // https://github.com/akiomik/vimeo-dl/blob/main/vimeo/masterjson_test.go#L277
        throw new Error('TODO');
    });

    await step('create audio file', () => {
        // https://github.com/akiomik/vimeo-dl/blob/main/vimeo/masterjson_test.go#L331
        throw new Error('TODO');
    });
});
