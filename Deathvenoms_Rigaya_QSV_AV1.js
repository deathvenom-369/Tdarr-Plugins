/* eslint-disable */
const details = () => {
    return {
        id: "Deathvenoms_Riqaya_QSV_AV1",
        Stage: "Pre-processing",
        Name: "Deathvenoms Riqaya QSV-AV1",
        Type: "Video",
        Operation: "Transcode",
        Description: "Uses Riqaya QSV_AV1 to convert videos to av1.",
        Version: "0.23.1.1",
        Tags: "AV1,QSV,transcode",

        Inputs: [
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
                tooltip: `This enables this plug will try to maintain HDR. This is a work inprogress. Currently only works \n
                width static HDR. It's not recommended for automated setups. Probably best to have a separate library.  \n\n `,
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
                tooltip: `This allows selection of 8bit or 10bit video. Unmanaged leaves this option blank. \n`,
            },
            {
                name: 'sd_Quality',
                defaultValue: '18',
                tooltip: `Specify the Quality value (CQP) for SD (570p and lower) content. 
                 \\nExample:\\n 
                
                18`,
            },
            {
                name: 'hd_Quality',
                defaultValue: '21',
                tooltip: `Specify the Quality value (CQP) for HD (720p) content.  
                
                \\nExample:\\n
                21`,
            },
            {
                name: 'fhd_Quality',
                defaultValue: '23',
                tooltip: `Specify the Quality value (CQP) for FHD (1080p) content.  
                
                \\nExample:\\n
                23`,
            },
            {
                name: 'uhd_Quality',
                defaultValue: '25',
                tooltip: `Specify the Quality value (CQP) for (4K/UHD) (2160p and grater) content.  
                
                \\nExample:\\n
                25`,
            },
            {
                name: 'av1_preset',
                type: 'string',
                defaultValue: 'higher',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'best',
                        'higher',
                        'high',
                        'balanced',
                        'fast',
                        'faster',
                    ],
                },
                tooltip: `Select the preset you want, similar to h.264  default (higher)`,
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
        infoLog: "",
    }
    var transcode = 0
    var masDC = ''
    var hdrWin = 0
    var contentl = ''
    var sdRes = ["240p", "360p", "480i", "480p", "576p"]
    var qual = ''
    var pixBit = ''
    var cpri = ''
    var ctrc = ''
    var cspa = ''
    var maxLu = ''
    var minLu = ''
    var hDRmaxCll = ''
    var hDRmaxFALL = ''
    var masDC = ''

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== "video") {
        response.infoLog += "☒File is not a video. Skipping this plugin.\n";
        return response;
    }
    response.infoLog += '☑File is a video! \n';
    response.infoLog += 'Current codec is ' + file.ffProbeData.streams[0].codec_name + ` \n`;
    if ((file.ffProbeData.streams[0].codec_name).toLowerCase !== 'av1') {
        response.infoLog += `New codec will be AV1 \n`;
        transcode = 1;
    }

    //Resolution detection
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
    //End of resolution detection



    // Detect and set up HDR
    if (inputs.use_HDR === true) {
        response.infoLog += `Running HDR detection.\n`
        // Primaries
        if (file.ffProbeData.streams[0].color_primaries !== undefined) {
            cpri = ` --colorprim ` + file.ffProbeData.streams[0].color_primaries
        } else {
            response.infoLog += `HDR detection. Failed (Primaries) \n`
            hdrWin = 1
        }
        // Transfer
        if (file.ffProbeData.streams[0].color_transfer !== undefined) {
            ctrc = ` --transfer ` + file.ffProbeData.streams[0].color_transfer
        } else {
            response.infoLog += `HDR detection. Failed (Transfer) \n`
            hdrWin = 1
        }
        // Color Space
        if (file.ffProbeData.streams[0].color_space !== undefined) {
            cspa = ` --colormatrix ` + file.ffProbeData.streams[0].color_space
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
            if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Display P3`) {
                masDC = ` --master-display \"G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.3127,0.3290)L(` + maxLu + `,` + minLu + `)\" --max-cll \"${contentl}\"`
            } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Theater P3`) {
                masDC = ` --master-display \"G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.314,0.351)L(` + maxLu + `,` + minLu + `)\" --max-cll \"${contentl}\"`
            } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Cinema P3`) {
                masDC = ` --master-display \"G(0.2650,0.6900)B(0.1500,0.0600)R(0.6800,0.3200)WP(0.32168\,0.33767)L(` + maxLu + `,` + minLu + `)\" --max-cll \"${contentl}\"`
            } else {
                response.infoLog += `HDR detection. Failed (HDR Color) \n`
                hdrWin = 1
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


    //ffmpeg QOL options    
    if (inputs.enable_Colorbit === '10bit') {
        pixBit = ' --output-depth 10';
    } else if (inputs.enable_Colorbit === '8bit') {
        pixBit = ' --output-depth 8';
    } else {
        pixBit = ''
    }


    //check if the file is eligible for transcoding
    if (transcode == 1) {
        response.processFile = true
        response.FFmpegMode = true
        response.infoLog += `☑File is ${file.video_resolution}, using a quality value of ` + qual + `.\n`
        response.infoLog += `☑File is not the requested codec and/or Letterbox. \n`
        response.infoLog += `☑File is being transcoded!\n`
        response.preset = `--avhw <io> --video-metadata copy  --metadata copy --chapter-copy -c av1 --cqp ${qual} --quality ${inputs.av1_preset} --level auto${cspa}${ctrc}${cpri}${masDC}${pixBit} --chromaloc auto --colorrange auto --audio-copy --sub-copy -o`
        return response
    } else {
        return response
    }



}
module.exports.details = details;
module.exports.plugin = plugin;