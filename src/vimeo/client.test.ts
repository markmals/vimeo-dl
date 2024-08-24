import { assertEquals } from 'jsr:@std/assert';
import { MockFetch } from 'https://deno.land/x/deno_mock_fetch@1.0.1/mod.ts';
import { Mainfest } from './manifest.ts';
import { Client } from '../mod.ts';

Deno.test('manifest correctly parses', () => {
    let body = `{
        "clip_id": "foo",
        "base_url": "../",
        "video": [
            {
                "id": "bar",
                "base_url": "bar/chop/",
                "bitrate": 574000,
                "init_segment": "baz",
                "segments": [
                    {
                        "url": "segment-1.m4s"
                    }
                ]
            }
        ],
        "audio": [
            {
                "id": "bar",
                "base_url": "../audio/bar/chop/",
                "bitrate": 255000,
                "init_segment": "baz",
                "segments": [
                    {
                        "url": "segment-1.m4s"
                    }
                ]
            }
        ]
    }`;

    let manifest = new Mainfest(JSON.parse(body), new URL('http://example.com/master.json'));

    assertEquals(manifest.clip_id, 'foo');
    assertEquals(manifest.base_url, '../');

    assertEquals(manifest.video[0].id, 'bar');
    assertEquals(manifest.video[0].base_url, 'bar/chop/');
    assertEquals(manifest.video[0].bitrate, 574000);
    assertEquals(manifest.video[0].init_segment, 'baz');
    assertEquals(manifest.video[0].decodedInitSegment.at(0), 109);
    assertEquals(manifest.video[0].decodedInitSegment.at(1), 172);
    assertEquals(manifest.video[0].segments[0].url, 'segment-1.m4s');

    assertEquals(manifest.audio[0].id, 'bar');
    assertEquals(manifest.audio[0].base_url, '../audio/bar/chop/');
    assertEquals(manifest.audio[0].bitrate, 255000);
    assertEquals(manifest.audio[0].init_segment, 'baz');
    assertEquals(manifest.audio[0].decodedInitSegment.at(0), 109);
    assertEquals(manifest.audio[0].decodedInitSegment.at(1), 172);
    assertEquals(manifest.audio[0].segments[0].url, 'segment-1.m4s');
});

Deno.test('download', async () => {
    let expected = new TextEncoder().encode('0123456789');

    let mockFetch = new MockFetch();

    mockFetch
        .intercept((input) => input.includes('http://example.com'), { method: 'GET' })
        .response('0123456789', { status: 200 });

    mockFetch.activate();

    let client = new Client(new URL('http://example.com/master.json'));

    let parcelURL = new URL('http://example.com/parcel/1080.mp4?range=0-100');
    let actual: Uint8Array | undefined;
    let output = new WritableStream<Uint8Array>({
        write(chunk) {
            actual = chunk;
        },
    });

    await client.download(parcelURL, output);
    assertEquals(expected, actual);

    mockFetch.deactivate();
});
