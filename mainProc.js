const { fork } = require('child_process');
const Discord = require('discord.js-light')
let starting = true;

require('dotenv').config()

async function runProc() {
    let processes = []
    let osutrack_proc = fork('./track.js', [])
    for (let i = 0; i < process.env.PROCESS_COUNT; i++) {
        processes[i] = fork('./botv5.js', [], {env: {...process.env, PROCESS_ID: i}})
    }

    starting = false;
    // osutrack proc messages
    
    osutrack_proc.on("message", (message) => {
        if (message.send_type == 'all') {
            for (let proc of processes) {
                proc.send(message)
            }
        }
        if (message.send_type == 'database') {
            processes[message.value.proc_id].send(message)
        }
    })
    
    // Discord proc messages
    for (let child_proc of processes) {
        child_proc.on("message", (message) => {
            if (message.send_type == 'all') {
                for (let proc of processes) {
                    proc.send(message)
                }
            }
            if (message.send_type == 'osutrack') {
                osutrack_proc.send(message)
            }
            if (message.send_type == 'return_value') {
                // Send message
                for (let proc of processes) {
                    proc.send(message)
                }
                let values = []
                // Get messages and return value
                let handler = (message1) => {
                    if (message1.send_type == 'returning') {
                        values.push(message1.value)
                    }
                    if (values.length == processes.length) {
                        for (let proc of processes) {
                            proc.off("message", handler)
                        }
                        child_proc.send({send_type: 'returned', cmd: message.cmd, value: message.value, 
                                        return_value: values})
                    }
                }
                for (let proc of processes) {
                    proc.on("message", handler)
                }
            }
            if (message.send_type == 'db') {
                for (let i = 0; i < processes.length; i++) {
                    if (i !== Number(message.value.proc_id)) {
                        processes[i].send(message)
                    }
                }
            }
        })
        child_proc.on("error", (err) => {
            console.log("err")
        })
        child_proc.on("close", (err) => {
            console.log("close")
            if (!starting) {
                starting = true;
                console.log(`------------------------------------\n` +
                            `Child Processes restarting!\n` + 
                            `------------------------------------`)
                osutrack_proc.kill('SIGKILL')
                for (let proc of processes) {
                    proc.kill('SIGKILL')
                }
                setTimeout(() => {
                    startUp()
                }, 1000)
            }
        })
        setTimeout(() => {
            console.log("ping")
            child_proc.send("ping")
        }, 5000);
    }
}

async function startUp() {
    let child_count = await Discord.Util.fetchRecommendedShards(process.env.BOT_TOKEN)
    console.log(child_count)
    process.env.PROCESS_COUNT = child_count
    runProc()
}

startUp()
