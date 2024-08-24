# vimeo-dl

A tool to download private videos on vimeo. A TypeScript rewrite of
[`vimeo-dl` for Go](https://github.com/akiomik/vimeo-dl).

## Installation

1. [Install Deno](https://deno.com)
2. Clone this repo:

```sh
git clone https://github.com/markmals/vimeo-dl
```

3. Compile the executable:

```sh
cd vimeo-dl
deno run compile
```

## Usage

```sh
./vimeo-dl --combine -i MASTER_JSON_URL
```

## Advanced Usage

```sh
# Download a video as `${clip_id}-video.mp4` (1080p).
# The highest resolution is automatically selected.
./vimeo-dl -i "https://skyfire.vimeocdn.com/xxx/yyy/live-archive/video/240p,360p,540p,720p,1080p/master.json?base64_init=1&query_string_ranges=1"
```

```sh
# Download a video as `${clip_id}-video.mp4` (720p) with the specified user-agent.
./vimeo-dl -i "https://skyfire.vimeocdn.com/xxx/yyy/live-archive/video/240p,360p,540p,720p,1080p/master.json?base64_init=1&query_string_ranges=1" \
         --video-id "720p" \
         --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"
```

```sh
# Download a video as ${clip_id}.mp4.
./vimeo-dl -i "https://8vod-adaptive.akamaized.net/xxx/yyy/sep/video/9f88d1ff,b83d0f9d,da44206b,f34fd50d,f9ebc26f/master.json?base64_init=1" \
         --video-id "b83d0f9d" \
         --audio-id "b83d0f9d" \
         --combine

# Download a video as my-video-file-name.mp4.
./vimeo-dl -i "https://8vod-adaptive.akamaized.net/xxx/yyy/sep/video/9f88d1ff,b83d0f9d,da44206b,f34fd50d,f9ebc26f/master.json?base64_init=1" \
         --video-id "b83d0f9d" \
         --audio-id "b83d0f9d" \
         --combine \
         --output "my-video-file-name"

# The combine option is equivalent to the following command.
./vimeo-dl -i "https://8vod-adaptive.akamaized.net/xxx/yyy/sep/video/9f88d1ff,b83d0f9d,da44206b,f34fd50d,f9ebc26f/master.json?base64_init=1" \
         --video-id "b83d0f9d" \
         --audio-id "b83d0f9d"
ffmpeg -i "$clip_id-video.mp4" -i "$clip_id-audio.mp4" -c copy "$clip_id.mp4"
```

## Options

```sh
Usage:   vimeo-dl --input <input>

Options:

  -h, --help                   - Show this help.                                                                       
  -V, --version                - Show the version number for this program.                                             
  -i, --input    <input>       - URL for master.json or playlist.json                                  (required)      
  --user-agent   <user-agent>  - User agent for request                                                                
  --video-id     <id>          - Video ID                                                                              
  --audio-id     <id>          - Audio ID                                                                              
  -o, --output   <output>      - Output file name                                                                      
  --combine                    - Combine video and audio into a single mp4 (ffmpeg must be installed)  (Default: false)
```
