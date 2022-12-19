/* eslint-disable */
const details = () => {
    return {
        id: "Deathvenoms_Convert_HDR_AI1",
        Stage: "Pre-processing",
        Name: "Remove letterbox using ffmpeg cropdetect",
        Type: "Video",
        Operation: "Transcode",
        Description: "Uses ffmpeg's cropdetect filter to determine the average crop size from 4 random locations in the video and transcode the video to remove letterboxing widthout changing the container, bitrate, codec, or downscaling the video.",
        Version: "0.22.12",
        Tags: "pre-processing,ffmpeg,cropdetect,letterbox,transcode",

        Inputs: [
            {
                name: 'enable_nevnc',
                type: 'boolean',
                defaultValue: false,
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'false',
                        'true',
                    ],
                },
                tooltip: `This enables Nvidia NVENC(short for Nvidia Encoder) is a feature in Nvidia graphics cards that performs video encoding, \n
                 offloading this compute-intensive task from the CPU to a dedicated part of the GPU. \n\n `,
            },
            {
                name: 'enable_Rigaya',
                type: 'boolean',
                defaultValue: false,
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'false',
                        'true',
                    ],
                },
                tooltip: `This enables Nvidia Rigaya's NVENC(short for Nvidia Encoder) This allowes HDR with NVENC. this is a seperat installed tool. \n\n `,
            },
            {
                name: 'check4letbox',
                type: 'boolean',
                defaultValue: false,
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'false',
                        'true',
                    ],
                },
                tooltip: `This enables this plug in to dettect a letterbox. If one is found it will be removed. \n\n `,
            },
            {
                name: 'use_HDR',
                type: 'boolean',
                defaultValue: false,
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'false',
                        'true',
                    ],
                },
                tooltip: `(DISABLES NVENC ENCODING) This enables this plug will try to maintain HDR. This is a work inprogress. Currently only works \n
                width static HDR. It's not recomended for automatided setups. Plrobly best to have a seperit library.  \n\n `,
            },
            {
                name: 'stopHDRfail',
                type: 'boolean',
                defaultValue: true,
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'false',
                        'true',
                    ],
                },
                tooltip: `This stops the plugin in the event of failing to process HDR. This ia a fail safe to prevent the deletion of HDR+ videos   \n\n `,
            },
            {
                name: 'enable_Colorbit',
                type: 'string',
                defaultValue: 'Unmanaged',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        '8bit',
                        '10bit',
                        'Unmanaged',
                    ],
                },
                tooltip: `This allows selection of 8bit or 10bit video. Unmanaged leaves this option blank. If HDR is enabled and sucsseful \n,
                10bit will be used  \n\n`
            },
            {
                name: 'codec_out',
                type: 'string',
                defaultValue: 'hevc',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'h264',
                        'hevc',
                        'av1',
                    ],
                },
                tooltip: `This allows selection of output codec. NVENC will be used if enabled except in the case of HDR and AV1(soon?!?!)  \n\n`,
            },
            {
                name: 'sd_Quality',
                defaultValue: '18',
                tooltip: `Specify the Quality value (CQ:V / CRF for h264-265 QP for AV1) for SD (570p and lower) content. 
                 \\nExample:\\n 
                
                18`,
            },
            {
                name: 'hd_Quality',
                defaultValue: '21',
                tooltip: `Specify the Quality value (CQ:V / CRF for h264-265 QP for AV1) for HD (720p) content.  
                
                \\nExample:\\n
                21`,
            },
            {
                name: 'fhd_Quality',
                defaultValue: '23',
                tooltip: `Specify the Quality value (CQ:V / CRF for h264-265 QP for AV1) for FHD (1080p) content.  
                
                \\nExample:\\n
                23`,
            },
            {
                name: 'uhd_Quality',
                defaultValue: '25',
                tooltip: `Specify the Quality value (CQ:V / CRF for h264-265 QP for AV1) for (4K/UHD) (2160p and grater) content.  
                
                \\nExample:\\n
                25`,
            },
            {
                name: 'h26x_preset',
                type: 'string',
                defaultValue: 'slow',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'slower',
                        'slow',
                        'medium',
                        'fast',
                        'veryfast',
                    ],
                },
                tooltip: `OPTIONAL, DEFAULTS TO SLOW IF NOT SET 
              \\n Select the ffmpeg preset you want,  default (slow)`,
            },
            {
                name: 'av1_Preset',
                defaultValue: '6',
                tooltip: `OPTIONAL PRESET (SIMILER TO SPEED), DEFAULTS TO 6 IF NOT SET 
                \\n Enter a preset (1-13) you want, leave empty for (6). Lower is slower
                
                \\nExample:\\n 
                  3 
                
                \\nExample:\\n 
                  6  
                
                \\nExample:\\n 
                  8  
                
                \\nExample:\\n 
                  10`,
            },
            {
                name: 'av1_fgrain',
                defaultValue: '0',
                tooltip: `Strangth of Synthesized Film Grain (0-50) Default 0(off). Seems to have large speed penalty when used.  
                
                \\nExample:\\n
                5`,
            },
            {
                name: 'av1_cpuThreads',
                defaultValue: '1',
                tooltip: `Set number of CPU threads to use %25 is usaly good so 8 cores is (2). Higher is faster but uses alot of RAM. /n
                This is more noticable when using lower presets and film grain. (hopfully better width ffmpeg/AV1 updates)                
                 \\nExample:\\n 
                
                4`,
            }
        ]
    }
}

const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    const fs = require("fs");
    const execSync = require("child_process").execSync;
    inputs = lib.loadDefaultValues(inputs, details);
    var response = {
        processFile: false,
        preset: "",
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: true,
        reQueueAfter: true,
        infoLog: "",
    }
    var transcode = 0
    var hdrWin = 0
    var decoder = ''
    var encoder = 'libx264'
    var sdRes = ["240p", "360p", "480i", "480p", "576p"]
    var nvencD = ["h263", "h264", "h265", "hevc", "mpeg2", "mpeg4", "mjpeg", "vc1", "vp8", "vp9"] //av1
    var nvencE = ['h264', "h265", "hevc"]
    var qual = ''
    var pixBit = ''
    var subcli = ''
    var maxmux = ''
    var map = ' -map 0'
    var cpri = ''
    var ctrc = ''
    var cspa = ''
    var maxLu = ''
    var minLu = ''
    var hDRmaxCll = ''
    var hDRmaxFALL = ''
    var masDC = ''
    var cropPH = Math.round(((file.ffProbeData.streams[0].height) - (file.ffProbeData.streams[0].height) * .25))
    var cropPW = Math.round(((file.ffProbeData.streams[0].width) - (file.ffProbeData.streams[0].width) * .125))
    var crop = ""
    var cropSet = ''
    var source = (file.meta.SourceFile) //source file
    var dir = (file.meta.Directory) //source directory
    var sourcename = file.meta.FileName.substring(0, file.meta.FileName.lastIndexOf(".")) //filename widthout extension
    var cropfile = `${dir}/${sourcename}_cd.txt` //location and name of the crop file

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== "video") {
        response.infoLog += "☒File is not a video. Skipping this plugin.\n";
        return response;
    }
    response.infoLog += '☑File is a video! \n';
    response.infoLog += 'Current codec is ' + file.ffProbeData.streams[0].codec_name + ` \n`;
    if ((file.ffProbeData.streams[0].codec_name).toLowerCase !== inputs.codec_out) {
        response.infoLog += `New codec will be ${inputs.codec_out} \n`;
        transcode = 1;
    }
    // Remove old crop data
    if (fs.existsSync(`${cropfile}`)) {
        response.infoLog += `Crop file found..... \n Removed. \n`;
        fs.unlinkSync(`${cropfile}`)
    }

    //Resiloution detection
    if ((sdRes).includes == file.video_resolution) {
        qual = `${inputs.sd_Quality}`
    }
    if (file.video_resolution == '720p') {
        qual = `${inputs.hd_Quality}`
    }
    if (file.video_resolution == '1080p' || '1080i') {
        qual = `${inputs.fhd_Quality}`
    }
    if (file.video_resolution == '4KUHD') {
        qual = `${inputs.uhd_Quality}`
    }
    //End of Resiloution detection



    // Letterbox removale
    if (inputs.check4letbox === false) {
        response.infoLog += 'User did not requset Letterbox removal \n'
    } else {
        response.infoLog += 'Starting Letterbox removal... \n'

        var timeS = Math.round(file.duration / 10)
        let min = (timeS * 2);
        let max = (timeS * 8);
        let ranSS = Math.floor(Math.random() * (max - min + 1)) + min;
        ranSS = Math.round(ranSS);
        var timeS2 = Math.round(timeS * 9)

        if (!fs.existsSync(`${cropfile}`)) {
            response.infoLog += `Creating crop values...\n`;
            execSync(
                `${otherArguments.ffmpegPath} -ss ${timeS} -i \"${source}\" -frames:v 240 -vf cropdetect -f null - 2>&1 | awk \'/crop/ { print $NF }\' | tail -240 > \"${cropfile}\"`
            );
            execSync(
                `${otherArguments.ffmpegPath} -ss ${ranSS} -i \"${source}\" -frames:v 300 -vf cropdetect -f null - 2>&1 | awk \'/crop/ { print $NF }\' | tail -300 >> \"${cropfile}\"`
            );
            execSync(
                `${otherArguments.ffmpegPath} -ss ${timeS2} -i \"${source}\" -frames:v 240 -vf cropdetect -f null - 2>&1 | awk \'/crop/ { print $NF }\' | tail -240 >> \"${cropfile}\"`
            );
        } else {
            response.infoLog += `Crop values already exist! \n`;
        }

        //get data from copvalue.txt
        var data = fs.readFileSync(`${cropfile}`).toString().split("\n"); //full data from cropvalue.txt

        //get height of the supposed cropped video
        let crop_w = [];
        let crop_h = [];
        let crop_x = [];
        let crop_y = [];

        for (var c = 0; c < (data.length - 1); c++) {
            crop = data[c].split(/[^\d]+/);
            //Width
            crop_w.push(Math.abs(parseInt(crop[1])));
            //Hight
            crop_h.push(Math.abs(parseInt(crop[2])));
            //X
            crop_x.push(Math.abs(parseInt(crop[3])));
            //Y
            crop_y.push(Math.abs(parseInt(crop[4])));
        }

        crop_w.sort((a, b) => a - b);  // Sort the array in ascending order

        let crop_w_median;
        if (crop_w.length % 2 === 0) {
            // If the length of the array is even, calculate the mean of the middle two elements
            crop_w_median = (crop_w[crop_w.length / 2 - 1] + crop_w[crop_w.length / 2]) / 2;
        } else {
            // If the length of the array is odd, return the middle element
            crop_w_median = crop_w[(crop_w.length - 1) / 2];
        }

        crop_h.sort((a, b) => a - b);  // Sort the array in ascending order

        let crop_h_median;
        if (crop_h.length % 2 === 0) {
            // If the length of the array is even, calculate the mean of the middle two elements
            crop_h_median = (crop_h[crop_h.length / 2 - 1] + crop_h[crop_h.length / 2]) / 2;
        } else {
            // If the length of the array is odd, return the middle element
            crop_h_median = crop_h[(crop_h.length - 1) / 2];
        }

        crop_x.sort((a, b) => a - b);  // Sort the array in ascending order

        let crop_x_median;
        if (crop_x.length % 2 === 0) {
            // If the length of the array is even, calculate the mean of the middle two elements
            crop_x_median = (crop_x[crop_x.length / 2 - 1] + crop_x[crop_x.length / 2]) / 2;
        } else {
            // If the length of the array is odd, return the middle element
            crop_x_median = crop_x[(crop_x.length - 1) / 2];
        }

        crop_y.sort((a, b) => a - b);  // Sort the array in ascending order

        let crop_y_median;
        if (crop_y.length % 2 === 0) {
            // If the length of the array is even, calculate the mean of the middle two elements
            crop_y_median = (crop_y[crop_y.length / 2 - 1] + crop_y[crop_y.length / 2]) / 2;
        } else {
            // If the length of the array is odd, return the middle element
            crop_y_median = crop_y[(crop_y.length - 1) / 2];
        }

        let crop_width = Math.round(crop_w_median / 4) * 4;  // Optimizes crop size
        let crop_height = Math.round(crop_h_median / 4) * 4;  // Optimizes crop size
        crop_x_median = Math.round(crop_x_median / 2) * 2;
        crop_y_median = Math.round(crop_y_median / 2) * 2;

        if ((crop_width != 0 || crop_height != 0) && (crop_width >= cropPW && crop_height >= cropPH)) {
            cropSet = ` -vf \"crop=${crop_width}:${crop_height}:${crop_x_median}:${crop_y_median}\"`
            response.infoLog += `☑Crop Settings: W:${crop_width} H:${crop_height} X:${crop_x_median} Y:${crop_y_median} \n`
        } else if (crop_height != 0 || crop_width != 0) {
            response.infoLog += `☒Letterbox was found but outside of bounds(${cropPW}, ${cropPH}) W:${crop_width} H:${crop_height} X:${crop_x_median} Y:${crop_y_median}. \n Skipping Crop! \n`
        } else {

            response.infoLog += `☑No Letterbox found. - Not croping. \n`
        }
    }
    // End of Letterbox removal



    // Detect and set up HDR
    if (inputs.use_HDR === true) {
        response.infoLog += `Running HDR detection.\n`
        // Primaries
        if (file.ffProbeData.streams[0].color_primaries !== '') {
            cpri = ` -color_primaries ` + file.ffProbeData.streams[0].color_primaries
        } else {
            response.infoLog += `HDR detection. Failed (Primaries) \n`
            hdrWin = 1
        }
        // Transfer
        if (file.ffProbeData.streams[0].color_transfer !== '') {
            ctrc = ` -color_trc ` + file.ffProbeData.streams[0].color_transfer
        } else {
            response.infoLog += `HDR detection. Failed (Transfer) \n`
            hdrWin = 1
        }
        // Color Space
        if (file.ffProbeData.streams[0].color_space !== '') {
            cspa = ` -colorspace ` + file.ffProbeData.streams[0].color_space
        } else {
            response.infoLog += `HDR detection. Failed (Color Space) \n`
            hdrWin = 1
        }
        // MaxCLL MaxFall
        if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MaxCLL !== undefined) {
            hDRmaxCll = file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MaxCLL.slice(0, -6)
            hDRmaxFALL = file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MaxFALL.slice(0, -6)
            contentl = hDRmaxCll + `,` + hDRmaxFALL
        } else {
            response.infoLog += `HDR detection. Failed (MaxCLL MaxFall) \n`
            hdrWin = 1
        }
        // HDR Color
        if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries !== undefined) {
            response.infoLog += `HDR "` + file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries + `" Detected.\n`
            maxLu = file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_Luminance.slice(24, -6)
            minLu = file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_Luminance.slice(5, -23)
            // Apply mastering colors AV1
            if (inputs.codec_out === 'av1') {
                if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Display P3`) {
                    masDC = `:mastering-display=G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.3127,0.3290)L(` + maxLu + `,` + minLu + `):content-light=${contentl}:enable-hdr=1`
                } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Theater P3`) {
                    masDC = `:mastering-display=G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.314,0.351)L(` + maxLu + `,` + minLu + `):content-light=${contentl}:enable-hdr=1`
                } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Cinema P3`) {
                    masDC = `:mastering-display=G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.32168\,0.33767)L(` + maxLu + `,` + minLu + `):content-light=${contentl}:enable-hdr=1`
                } else {
                    response.infoLog += `HDR detection. Failed (HDR Color) \n`
                    hdrWin = 1
                }
            } else if (inputs.codec_out === 'hevc') {
                if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Display P3`) {
                    masDC = `:hdr10_opt=1:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(` + (maxLu * 1000) + `,` + (minLu * 1000) + `):max-cll=${contentl}:hdr10=1`
                } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Theater P3`) {
                    masDC = `:hdr10_opt=1:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(` + (maxLu * 1000) + `,` + (minLu * 1000) + `):max-cll=${contentl}:hdr10=1` // place holder
                } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Cinema P3`) {
                    masDC = `:hdr10_opt=1:master-display=G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(` + (maxLu * 1000) + `,` + (minLu * 1000) + `):max-cll=${contentl}:hdr10=1` // place holder
                } else {
                    response.infoLog += `HDR detection. Failed (HDR Color) \n`
                    hdrWin = 1
                }

            }

        }
        if ((inputs.stopHDRfail === true) && (hdrWin == 1)) {
            return response
        } else if (hdrWin == 1) {
            response.infoLog += `HDR not found \n`
        }
    } else {
        response.infoLog += `HDR detection disabled \n`
        hdrWin = 1
    }
    // End of HDR detection and setup


    // Decoder detection
    if (inputs.enable_nevnc == true) { //Use NVENC?
        response.infoLog += 'User requset use of NVENC. Decoder detection... \n'
        if (nvencD.includes(file.ffProbeData.streams[0].codec_name)) {
            decoder = ` -c:v ` + file.ffProbeData.streams[0].codec_name + `_cuvid`
            response.infoLog += '☑ Set decoder: ' + file.ffProbeData.streams[0].codec_name + '_cuvid \n'
        } else {
            response.infoLog += 'NVENC decoder not found. Decoding width CPU. \n'
        }
    } else {
        response.infoLog += 'User did not requset use of NVENC. Decoding width CPU. \n'
    }
    //End of Decoder detection


    //Encoder selection
    if (inputs.enable_nevnc == true && nvencE.includes(inputs.codec_out) && hdrWin == 1) { // Check if the user has requested NVENC, the selected codec is supported, and if HDR is not enabled
        response.infoLog += 'User requset use of NVENC. Encoder detection... \n'
        excom = `${cpri}${ctrc}${cspa} -preset ${inputs.h26x_preset} -cq ${qual} -rc-lookahead 32`
        encoder = ` ${inputs.codec_out}_nvenc`
    } else if( inputs.enable_nevnc == true && inputs.codec_out == 'hevc' && inputs.enable_Rigaya == true) { 
        response.infoLog += 'User requset use of NVENC.  Ecoder detection... \n HDR NVENC using Rigaya\'s NVENC \n'
        excom = `${cpri}${ctrc}${cspa} -preset:v ${inputs.h26x_preset} --master-display "${masDC}  -cqp ${qual}`
        encoder = ` ${inputs.codec_out}_rigaya`
}else {
        response.infoLog += 'NVENC encoder not requseted or not found. Encoding width CPU \n'
        if (inputs.codec_out === 'av1') {
            excom = `${cpri}${ctrc}${cspa} -strict experimental -preset ${inputs.av1_Preset} -svtav1-params \"lp=${inputs.av1_cpuThreads}:tune=0:film-grain=${inputs.av1_fgrain}:scd=1${masDC}\" -qp ${qual}`
            encoder = ` libsvtav1`
        } else if (inputs.codec_out === 'hevc') {
            excom = `${cpri}${ctrc}${cspa} -preset:v ${inputs.h26x_preset} -x265-params rc-lookahead=32:ref=6:b-intra=1:aq-mode=3${masDC} -crf:v ${qual}`
            encoder = ` libx265`
        } else {
            excom = `${cpri}${ctrc}${cspa} -crf:v ${qual} -preset:v ${inputs.h26x_preset} -rc-lookahead 32`
            encoder = ` libx264` //fallback to h264
        }
    }
    response.infoLog += `☑ Set encoder: ${encoder} \n`
    //End of Encoder selection


    //ffmpeg QOL options    
    if (inputs.enable_Colorbit === '10bit' && encoder != " h264_nvenc") {
        if (encoder == " hevc_nvenc") {
            pixBit = ' -pix_fmt p010le'
        } else {
            pixBit = ' -pix_fmt yuv420p10le';
        }
    } else if (inputs.enable_Colorbit === '8bit' || encoder === " h264_nvenc") {
        pixBit = ' -pix_fmt yuv420p';
    } else {
        pixBit = ''
    }

    //Other Streams 
    //Set Subtitle 
    for (var i = 0; i < file.ffProbeData.streams.length; i++) {
        try {
            if (
                file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mov_text' &&
                file.ffProbeData.streams[i].codec_type.toLowerCase() == 'subtitle'
            ) {
                subcli = ` -c:s srt`
            }
        } catch (err) { }

        //Stop TrueHD causing to many packets error
        try {
            if (
                file.ffProbeData.streams[i].codec_name.toLowerCase() == 'truehd' ||
                (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'dts' &&
                    file.ffProbeData.streams[i].profile.toLowerCase() == 'dts-hd ma') ||
                (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'aac' &&
                    file.ffProbeData.streams[i].sample_rate.toLowerCase() == '44100' &&
                    file.ffProbeData.streams[i].codec_type.toLowerCase() == 'audio')
            ) {
                maxmux = ` -max_muxing_queue_size 9999`
            } else {
                maxmux = ` -max_muxing_queue_size 4096`
            }
        } catch (err) { }

        //Stop errors from embeded pictures
        try {
            if (
                (file.ffProbeData.streams[i].codec_name.toLowerCase() == 'png' ||
                    file.ffProbeData.streams[i].codec_name.toLowerCase() == 'bmp' ||
                    file.ffProbeData.streams[i].codec_name.toLowerCase() == 'mjpeg') &&
                file.ffProbeData.streams[i].codec_type.toLowerCase() == 'video'
            ) {
                map = ` -map 0:v:0 -map 0:a -map 0:s?`
            }
        } catch (err) { }
    }


    //check if the file is eligible for transcoding
    if (transcode == 1) {
        response.processFile = true
        response.FFmpegMode = true
        response.reQueueAfter = true
        response.infoLog += `☑File is ${file.video_resolution}, using a quality value of ` + qual + `.\n`
        response.infoLog += `☑File is not the requested codec and/or Letterbox. \n`
        response.infoLog += `☑File is being transcoded!\n`
        response.preset = `<io>${decoder}${map} -c:v${encoder} -b:v 0${pixBit}${cropSet}${excom} -map_metadata 0 -a53cc 0 -c:a copy${subcli}${maxmux}`
        // Remove old crop data
        if (fs.existsSync(`${cropfile}`)) {
            response.infoLog += `Clearing temperary crop file.... \n `;
            fs.unlinkSync(`${cropfile}`)

        }

        return response
    } else {
        return response
    }
}
module.exports.details = details;
module.exports.plugin = plugin;
