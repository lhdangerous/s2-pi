/**
 Writen by August Sanghyun Park.
 2018,Sep.
 Alan Yorinks 의 s2-pi 프로젝트로부터 fork함.

 servo 작동기능 추가.

 */

(function (ext) {
    var socket = null;

    var connected = false;

    // an array to hold possible digital input values for the reporter block
    var digital_inputs = new Array(32);
    var myStatus = 1; // initially yellow
    var myMsg = 'not_ready';

    ext.cnct = function (callback) {
        window.socket = new WebSocket("ws://127.0.0.1:9000");
        window.socket.onopen = function () {
            var msg = JSON.stringify({
                "command": "ready"
            });
            window.socket.send(msg);
            myStatus = 2;

            // change status light from yellow to green
            myMsg = 'ready';
            connected = true;

            // initialize the reporter buffer
            digital_inputs.fill('0');

            // give the connection time establish
            window.setTimeout(function() {
            callback();
        }, 1000);

        };

        window.socket.onmessage = function (message) {
            var msg = JSON.parse(message.data);

            // handle the only reporter message from the server
            // for changes in digital input state
            var reporter = msg['report'];
            if(reporter === 'digital_input_change') {
                var pin = msg['pin'];
                digital_inputs[parseInt(pin)] = msg['level']
            }
            console.log(message.data)
        };
        window.socket.onclose = function (e) {
            console.log("Connection closed.");
            socket = null;
            connected = false;
            myStatus = 1;
            myMsg = 'not_ready'
        };
    };

    // Cleanup function when the extension is unloaded
    ext._shutdown = function () {
        var msg = JSON.stringify({
            "command": "shutdown"
        });
        window.socket.send(msg);
    };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function (status, msg) {
        return {status: myStatus, msg: myMsg};
    };

    // when the connect to server block is executed
    ext.input = function (pin) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'input', 'pin': pin
            });
            window.socket.send(msg);
        }
    };

    // when the digital write block is executed
    ext.digital_write = function (pin, state) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        console.log("digital write");
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'digital_write', 'pin': pin, 'state': state
            });
            console.log(msg);
            window.socket.send(msg);
        }
    };

    // when the PWM block is executed
    ext.analog_write = function (pin, value) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        console.log("analog write");
        // validate the pin number for the mode
        if (validatePin(pin)) {
            // validate value to be between 0 and 255
            if (value === 'VAL') {
                alert("PWM Value must be in the range of 0 - 255");
            }
            else {
                value = parseInt(value);
                if (value < 0 || value > 255) {
                    alert("PWM Value must be in the range of 0 - 255");
                }
                else {
                    var msg = JSON.stringify({
                        "command": 'analog_write', 'pin': pin, 'value': value
                    });
                    console.log(msg);
                    window.socket.send(msg);
                }
            }
        }
    };

    // when the play tone block is executed
    ext.play_tone = function (pin, frequency) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'tone', 'pin': pin, 'frequency': frequency
            });
            console.log(msg);
            window.socket.send(msg);
        }
    };

    // when 서보작동 block is executed
    ext.moveServo = function (pin, degree) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        // validate the pin number for the mode
        if (validatePin(pin)) {
            var msg = JSON.stringify({
                "command": 'servo', 'pin': pin, 'degree': degree
            });
            console.log(msg);
            window.socket.send(msg);
        }
    };

    // when the digital read reporter block is executed
    ext.digital_read = function (pin) {
        if (connected == false) {
            alert("Server Not Connected");
        }
        else {
                return digital_inputs[parseInt(pin)]

        }
    };

    // general function to validate the pin value
    function validatePin(pin) {
        var rValue = true;
        if (pin === 'PIN') {
            alert("Insert a valid BCM pin number.");
            rValue = false;
        }
        else {
            var pinInt = parseInt(pin);
            if (pinInt < 0 || pinInt > 31) {
                alert("BCM pin number must be in the range of 0-31.");
                rValue = false;
            }
        }
        return rValue;
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            // Block type, block name, function name
            ["w", 'Connect to s2_pi server.', 'cnct'],
            [" ", 'Set BCM %n as an Input', 'input','PIN'],
            [" ", "Set BCM %n Output to %m.high_low", "digital_write", "PIN", "0"],
            [" ", "Set BCM PWM Out %n to %n", "analog_write", "PIN", "VAL"],
            [" ", "Tone: BCM %n HZ: %n", "play_tone", "PIN", 1000],
            [" ", "Move Servo at BCM %n to %n degree", "moveServo", "PIN", 0],	// 실행명령, n번ㅍ에 서보 n도로 움직이기. 기본표시값'PIN',0도
            ["r", "Read Digital Pin %n", "digital_read", "PIN"]

        ],
        "menus": {
            "high_low": ["0", "1"]

        },
        url: 'http://MrYsLab.github.io/s2-pi'
    };

    // Register the extension
    ScratchExtensions.register('s2_pi', descriptor, ext);
})({});

