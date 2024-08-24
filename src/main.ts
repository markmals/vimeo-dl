import { Command } from 'cliffy';
import { main } from './cmd/vimeo-dl.ts';
import config from '../deno.json' with { type: 'json' };

try {
    await new Command()
        .name('vimeo-dl')
        .version(config.version)
        .option('-i, --input <input>', 'URL for master.json or playlist.json', {
            required: true,
        })
        .option('--user-agent <user-agent>', 'User agent for request')
        .option('--video-id <id>', 'Video ID')
        .option('--audio-id <id>', 'Audio ID')
        .option('-o, --output <output>', 'Output file name')
        .option(
            '--combine',
            'Combine video and audio into a single mp4 (ffmpeg must be installed)',
            { default: false },
        )
        .action(main)
        .parse(Deno.args);
} catch (error) {
    console.error(`${error}`);
    Deno.exit(1);
}
