const protobuf = require('protocol-buffers');
const path = require('path');
const fs = require('fs');

// Import protocol buffer file from /proto/judgement_api.proto
// For more information please see https://github.com/couger-inc/berlin_hackathon/wiki
const judgementAPI = protobuf(fs.readFileSync(path.resolve(__dirname, '../../proto/judgement_api.proto')));

const reactions = [87, 88, 93, 101, 110, 109, 116, 106, 141];
const reactions2 = {
    'umbrella': 42,
    'handbag': 43,
    'tie': 44,
    'suitcase': 45,
    'bottle': 46,
    'chair': 47,
    'dining table': 48,
    'tv': 49,
    'cell phone': 50,
};

/**
 * Handler Class
 */
class Handler {
    /**
     * constructor
     * @param {any} connection
     */
    constructor(connection) {
        this.connection = connection;

        this.obj = {};

        // example: Send Move ("Camera Front") + LookAt ("Camera") + Motion (Waving her hands) + Speech ("Nice to meet you")
        // const res = judgementAPI.JudgementResponse.encode({
        //     actions: [
        //     {
        //         type: judgementAPI.ActionType.Move,
        //         args: ['CameraFrontBustup'],
        //     },
        //     {
        //         type: judgementAPI.ActionType.LookAt,
        //         args: ['Camera'],
        //     },
        //     {
        //         type: judgementAPI.ActionType.Motion,
        //         args: ['12'],
        //     },
        //     {
        //         type: judgementAPI.ActionType.Speech,
        //         args: ['2'],
        //     },
        //     {
        //         type: judgementAPI.ActionType.Wait,
        //         args: ['5000'],
        //     }],
        // });
        // connection.sendBytes(res);
        this._speech(63);
    }

    /**
     * judgement
     * @param {Buffer} rawReq
     */
    judgement(rawReq) {
        // console.log(`Received Binary Message of ${rawReq.byteLength} bytes`);
        if (rawReq.byteLength === 0) {
            return;
        }
        // Decode rawReq using protocol buffer
        const req = judgementAPI.JudgementRequest.decode(rawReq);
        console.log(JSON.stringify(req));

        console.log(req.message);
        if (req.message != '') {
            if (match(req.message, ['bye', 'ばいばい', 'バイバイ', 'see you'])) {
                this._speech(79);
                return;
            }
            if (match(req.message, ['what', '何'])) {
                // 疑問系、知らんがな
                this._speech(197);
                this._speech(59);
                return;
            }
            if (match(req.message, ['かわいい', 'cute'])) {
                this._speech(60, 14);
                this._speech(159);
                return;
            }
            this._speech(reactions[Math.floor(Math.random() * reactions.length)], 13);
        }
        if (req.images.length != 0) {
            req.images.forEach((image)=>{
                if (image.confidence > 80) {
                    if (!this.obj[image.label]) {
                        if (Object.keys(reactions2).indexOf(image.label)!=-1) {
                            this.obj[image.label] = true;
                            this._speech(23);
                            this._speech(reactions2[image.label]);
                            setTimeout(() => {
                                this.obj[image.label] = false;
                            }, 60000);
                        }
                    }
                }
            });
            if (req.images.filter((image)=>image.label=='person').length >= 3) {
                if (!this.obj['person']) {
                    this.obj['person'] = true;
                    this._speech(32);
                    this._speech(41);
                    setTimeout(() => {
                        this.obj['person'] = false;
                    }, 60000);
                }
            }
        }
    }

    _speech(word, motion) {
        let res;
        if (motion == null) {
            res = judgementAPI.JudgementResponse.encode({
                actions: [{
                    type: judgementAPI.ActionType.Move,
                    args: ['CameraFrontBody'],
                },
                {
                    type: judgementAPI.ActionType.LookAt,
                    args: ['Camera'],
                },
                {
                    type: judgementAPI.ActionType.Speech,
                    args: [word.toString()],
                },
                {
                    type: judgementAPI.ActionType.Wait,
                    args: ['1500'],
                }],
            });
        } else {
            res = judgementAPI.JudgementResponse.encode({
                actions: [{
                    type: judgementAPI.ActionType.Move,
                    args: ['CameraFrontBody'],
                },
                {
                    type: judgementAPI.ActionType.LookAt,
                    args: ['Camera'],
                },
                {
                    type: judgementAPI.ActionType.Motion,
                    args: [motion.toString()],
                },
                {
                    type: judgementAPI.ActionType.Speech,
                    args: [word.toString()],
                },
                {
                    type: judgementAPI.ActionType.Wait,
                    args: ['1500'],
                }],
            });
        }
        this.connection.sendBytes(res);
    }
    /**
     * Destractor
     */
    close() {
    }
}

module.exports = Handler;

function match(str, words) {
    for (let i=0; i<words.length; i++) {
        if (str.indexOf(words[i]) != -1) {
            return true;
        }
        const tmp = str.charAt(0).toUpperCase() + str.slice(1);
        if (tmp.indexOf(words[i]) != -1) {
            return true;
        }
    }
    return false;
}
