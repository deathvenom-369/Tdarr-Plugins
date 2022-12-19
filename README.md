## Tdarr-Plugins
# "Deathvenoms_Convert_HDR_AV1" 

#### This Plugin uses ffmpeg's cropdetect filter to remove letterboxing from a video. It can be configured to use either the CPU or Nvidia NVENC (a feature in  Nvidia graphics cards that performs video encoding) to perform this task, and it can also be used to copy HDR10 settings. It has options for selecting the output settings and requires the mediainfo tool to be installed. It has been tested using the latest version of ffmpeg on both [Windows](https://www.gyan.dev/ffmpeg/builds/#release-builds "Windows") and [Linux via Jellyfin-ffmpeg](https://github.com/jellyfin/jellyfin-ffmpeg/releases/tag/v5.1.2-5 "jellyfin-ffmpeg Linux"), and it has a version number of "5.1.2". It has been tagged with keywords such as "pre-processing", "ffmpeg", "cropdetect", "letterbox", and "transcode".

#### This plugin includes an array of input parameters that can be configured by the user. These include options to enable Nvidia NVENC and [Rigaya's NVENC](https://github.com/rigaya/NVEnc/releases "Rigaya's NVENC") Rigaya's NVENC (a separate tool that allows for HDR with NVENC), detect and remove letterboxing, maintain HDR, stoping the process in the event of failing to process HDR, select the color bit depth of the output video, specify the codec for the output video, and set the output quality.

#### Finally, the plugin includes a set of output parameters that describe the results of the process, such as the input and output file names and paths, the input and output video and audio codecs and bitrates, and the input and output resolutions.
