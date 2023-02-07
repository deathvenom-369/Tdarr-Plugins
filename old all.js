/* eslint-disable */
const details = () => {
    return {
        id: "Deathvenoms_Convert_HDR_AV1",
        Stage: "Pre-processing",
        Name: "Deathvenoms Riqaya QSV-AV1",
        Type: "Video",
        Operation: "Transcode",
        Description: "Uses Riqaya QSV_AV1 to convert videos to av1.",
        Version: "0.23.1.1",
        Tags: 'pre-processing,ffmpeg,video only,av1,qsv av1,configurable',

        Inputs: [
            {
                name: 'moreThan1',
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
                name: 'rigayaENC',
                type: 'string',
                defaultValue: 'NVEnc',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'NVEnc',
                        'VCEEnc',
                        'QSVEnc',
                    ],
                },
                tooltip: `Please Choose encoder . \n`,
            },
            {
                name: 'codec',
                type: 'string',
                defaultValue: 'av1',
                inputUI: {
                    type: 'dropdown',
                    options: [
                        'av1',
                        'hevc',
                    ],
                },
                tooltip: `Please Choose Codec. \n`,
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
                name: 'preset',
                defaultValue: '',
                tooltip: `Specify your preset if left blank encoder will use default. \n.  
                \\nNVEnc: \\n
                https://github.com/rigaya/NVEnc/blob/master/NVEncC_Options.en.md#-u---preset
                \\nVCEEnc: \\n
                https://github.com/rigaya/VCEEnc/blob/master/VCEEncC_Options.en.md#-u---preset \n\n
                \\nQSVEnc: \\n
                https://github.com/rigaya/QSVEnc/blob/master/QSVEncC_Options.en.md#-u---quality-string \n`,
            },
        ]
    }
}


const plugin = (file, librarySettings, inputs, otherArguments) => {
    const lib = require('../methods/lib')();
    const fs = require("fs");
    const execSync = require("child_process").execSync;
    inputs = lib.loadDefaultValues(inputs, details);
    var masDC = ''
    var hdrWin = 0
    var contentl = ''
    var sdRes = ["240p", "360p", "480i", "480p", "576p"]
    var qual = ''
    var qualSet = '--cqp'
    var pixBit = ''
    var cpri = ''
    var ctrc = ''
    var cspa = ''
    var hDRmaxCll = ''
    var hDRmaxFALL = ''
    var masDC = ''
    var hpath = otherArguments.handbrakePath
    var hpathB = `${hpath}` + ".bak"
    var binPath = hpath.substring(0, hpath.lastIndexOf("/" || "\\"))


    var response = {
        processFile: false,
        preset: '',
        container: '.mkv',
        handBrakeMode: false,
        FFmpegMode: false,
        infoLog: '',
    }


    response.infoLog += `${hpathB} \n`
    if (inputs.moreThan1 == false) {
        if ((otherArguments.nodeHardwareType == 'nvenc' || 'qsv' || 'vaapi') && (fs.existsSync(hpathB))) {
            fs.copyFileSync(hpath + '.bak', hpath)
        }
    }

    // Check if file is a video. If it isn't then exit plugin.
    if (file.fileMedium !== "video") {
        response.infoLog += "☒File is not a video. Skipping this plugin.\n";
        return response;
    } else {
        response.infoLog += `☑File is a video! \n`;
        response.infoLog += 'Current codec is ' + file.ffProbeData.streams[0].codec_name + ` \n`;
    }
    // Check if codec is correct
    if (((file.ffProbeData.streams[0].codec_name) !== inputs.codec)) {
        response.infoLog += `New codec will be ${inputs.codec} \n`;
    } else {
        response.infoLog += `☑File is already ${inputs.codec} \n`
        response.reQueueAfter = true
        response.processFile = false
        return response;
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



    //Rigaya selection
    if ((inputs.rigayaENC == 'NVEnc') && (otherArguments.nodeHardwareType == 'nvenc')) {
        if (inputs.moreThan1 == false) {
            if (hpath.includes(".exe")) {
                fs.copyFileSync(binPath + '/NVEncC64.exe', hpath)
            } else {
                fs.copyFileSync(`/bin/nvencc`, hpath)
            }
        }
    } else if ((inputs.rigayaENC == 'VCEEnc') && (otherArguments.nodeHardwareType == 'vaapi')) {
        if (inputs.moreThan1 == false) {
            if (hpath.includes(".exe")) {
                fs.copyFileSync(binPath + '/VCEEncC64.exe', hpath)
            } else {
                fs.copyFileSync(`/bin/vceencc`, hpath)
            }
        }
    } else if ((inputs.rigayaENC == 'QSVEnc') && (otherArguments.nodeHardwareType == 'qsv')) {
        qualSet = '--icq'
        if (inputs.moreThan1 == false) {
            if (hpath.includes(".exe")) {
                fs.copyFileSync(binPath + '/QSVEncC64.exe', hpath)
            } else {
                fs.copyFileSync(`/bin/qsvencc`, hpath)
            }
        }
    } else {
        response.reQueueAfter = true
        response.processFile = false
     //   return response
    }
    if (inputs.preset !== undefined || '')
        gPreset = ` -u ${inputs.preset}`
    //End of Rigaya selection


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
            // Apply mastering colors
            if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Display P3`) {
                masDC = ` --master-display \"G(13250,13250)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1)\" --max-cll \"${contentl}\"`
            } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Theater P3`) {
                masDC = ` --master-display \"G(13250,13250)B(7500,3000)R(34000,16000)WP(15700,17550)L(10000000,1)\" --max-cll \"${contentl}\"`
            } else if (file.mediaInfo.track.filter((row) => row['@type'] === 'Video')[0].MasteringDisplay_ColorPrimaries === `Cinema P3`) {
                masDC = ` --master-display \"G(13250,13250)B(7500,3000)R(34000,16000)WP(16084,16883.5)L(10000000,1)\" --max-cll \"${contentl}\"`
            } else {
                response.infoLog += `HDR detection. Failed (HDR Color) \n`
                hdrWin = 1
            }
        }
        if ((inputs.stopHDRfail === true) && (hdrWin == 1)) {
            response.infoLog += `HDR failed STOP \n`
            response.processFile = false
            return response
        } else if (hdrWin == 1) {
            response.infoLog += `HDR not found \n`
        }
    } else {
        response.infoLog += `HDR detection disabled \n`
        hdrWin = 1
    }
    // End of HDR detection and setup


    //ffmpeg color depth  options    
    if (inputs.enable_Colorbit === '10bit') {
        pixBit = ' --output-depth 10';
    } else if (inputs.enable_Colorbit === '8bit') {
        pixBit = ' --output-depth 8';
    } else {
        pixBit = ''
    }


    //check if the file is eligible for transcoding
    response.infoLog += `☑File is not the requested codec. \n`
    response.infoLog += `☑File is ${file.video_resolution}, using a quality value of ` + qual + `.\n`
    response.infoLog += `☑File is being transcoded!\n Tddar will not report progress. Look for the page icon \n`
    response.processFile = true
    response.handBrakeMode = true
    response.preset = `--avhw --video-metadata copy --metadata copy --chapter-copy -c ${inputs.codec} ${qualSet} ${qual}${cspa}${ctrc}${cpri}${masDC}${pixBit} --chromaloc auto --colorrange auto --audio-copy --sub-copy`
    response.reQueueAfter = true
    return response




}
module.exports.details = details;
module.exports.plugin = plugin;