var cache = {}
var track = []
var storedmapid = []
var storedee = {}

const Discord = require('discord.js');
const nodeosu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')
const fs = require('fs')
const san = require('sanitize-html')

var osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

var ee = JSON.parse(process.env.EASTER_EGG)

var refresh = 0

function rankingletters(letter) {
    if (letter == "F") {
        return '<:rankingF:557836461077168138>';
    }
    if (letter == "A") {
        return '<:rankingA:520932311613571072>';
    }
    if (letter == "B") {
        return '<:rankingB:520932334061748224>';
    }
    if (letter == "C") {
        return '<:rankingC:520932353103626271>';
    }
    if (letter == "D") {
        return '<:rankingD:520932369172004869>';
    }
    if (letter == "S") {
        return '<:rankingS:520932426449682432>';
    }
    if (letter == "SH") {
        return '<:rankingSH:520932441687588864>';
    }
    if (letter == "X") {
        return '<:rankingX:520932410746077184>';
    }
    if (letter == "XH") {
        return '<:rankingXH:520932395080482858>';
    }
}

function mods(mod) {
    var mods = {
        NoFail     : "NF",
        Easy       : "EZ",
        TouchDevice: "TD",
        Hidden     : "HD",
        HardRock   : "HR",
        SuddenDeath: "SD",
        DoubleTime : "DT",
        HalfTime   : "HT",
        Nightcore  : "NC",
        Flashlight : "FL",
        SpunOut    : "SO"
    }
    var shortenmod = '+';
    var bitpresent = 0
    for (var i = 0; i < mod.length; i++) {
        if (shortenmod.includes('DT') == true && mods[mod[i]] == 'NC') {
            shortenmod = shortenmod.substring(0,shortenmod.length - 2)
        }
        if (mods[mod[i]]) {
            shortenmod += mods[mod[i]];
            bitpresent += nodeosu.Constants.Mods[mod[i]]
        }
    }
    if (mod.length == 0 || shortenmod == '+'){
        shortenmod += 'No Mod';
    }
    return {shortenmod: shortenmod, bitpresent: bitpresent}
}

function bittomods(number) {
    var bit = number.toString(2)
    var shortenmod = "+"
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    var modlist = {
        19: 'SO',
        21: 'FL',
        22: 'NC',
        23: 'HT',
        24: 'RX',
        25: 'DT',
        26: 'SD',
        27: 'HR',
        28: 'HD',
        29: 'TD',
        30: 'EZ',
        31: 'NF'
    }
    for (var i = 31; i >= 0; i--) {
        if (fullbit[i] == 1) {
            shortenmod += modlist[i+1]
        }
    }
    if (number == 0) {
        shortenmod += 'No Mod'
    }
    return shortenmod
}

function timeago(time) {
    var dateago = new Date(time).getTime()
    var datenow = new Date().getTime()
    var datenew = new Date(datenow - 28800000 - dateago)
    var sec = datenew.getUTCSeconds()
    var min = datenew.getUTCMinutes()
    var hour = datenew.getUTCHours()
    var day = (datenew.getUTCDate() - 1)
    var month = datenew.getUTCMonth()
    var year = (datenew.getUTCFullYear() - 1970)
    var text = ''
    if (year > 0) {
        text = `${year} year and ${month} month ago`
    } else if (month > 0) {
        text = `${month} month and ${day} day ago`
    } else if (day > 0) {
        text = `${day} day and ${hour} hour ago`
    } else if (hour > 0)  {
        text = `${hour} hour and ${min} minute ago`
    } else {
        text = `${min} minute and ${sec} second ago`
    }
    return text
}

function mapdetail(mods,length,bpm,cs,ar,od,hp) {
    var arms = 0
    var odms = 0
    mods = mods.toLowerCase()
    function EZ() {
        cs = cs / 2
        ar = ar / 2
        od = od / 2
        hp = hp / 2
    }

    function HT() {
        length = length * 1.33
        bpm = bpm / 1.33
        if (ar < 5) {
            arms = 1600 + ((5 - ar) * 160)
        }
        if (ar == 5) {
            arms = 1600
        }
        if (ar > 5) {
            arms = 1600 - ((ar - 5) * 200)
        }
        if (arms < 1200) {
            ar = (1200 + 750 - arms) / 150
        }
        if (arms == 1200) {
            ar = 5
        }
        if (arms > 1200) {
            ar = (1200 + 600 - arms) / 120
        }
        odms = (50 + 30 * (5 - od) / 5) * 0.75
        od = (30 + 50 - odms) / 6
        hp = hp / 1.5
    }

    function HR() {
        cs = cs * 1.3
        ar = ar * 1.4
        od = od * 1.4
        hp = hp * 1.4
        if (ar > 10) {
            ar = 10
        }
        if (od > 10) {
            od = 10
        }
        if (hp > 10) {
            hp = 10
        }
    }

    function DT() {
        length = length / 1.5
        bpm = bpm * 1.5
        if (ar < 5) {
            arms = 800 + ((5 - ar) * 80)
        }
        if (ar == 5) {
            arms = 800
        }
        if (ar > 5) {
            arms = 800 - ((ar - 5) * 100)
        }
        if (arms < 1200) {
            ar = (1200 + 750 - arms) / 150
        }
        if (arms == 1200) {
            ar = 5
        }
        odms = (50 + 30 * (5 - od) / 5) * 0.67
        od = (30 + 50 - odms) / 6

        hp = hp * 1.5
    }

    if (mods.includes("ez") == true) {
        EZ()
    }
    if (mods.includes("hr") == true) {
        HR()
    }
    if (mods.includes("ht") == true) {
        HT()
    }
    if (mods.includes("dt") == true || mods.includes("nc") == true) {
        DT()
    }
    if (ar < 0) {
        ar = 0
    }
    if (od < 0) {
        od = 0
    }
    if (hp < 0) {
        hp = 0
    }
    if (cs > 10) {
        cs = 10
    }
    if (ar > 11) {
        ar = 11
    }
    if (od > 11) {
        od = 11
    }
    if (hp > 11) {
        hp = 11
    }
    return {length: length, bpm: bpm, cs: cs, ar: ar, od: od, hp: hp}
}


async function precalc(beatmapid) {
    var parser = new calc.parser()
    var map = await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)
    parser.feed(map)
    return parser
}

function ppcalc(parser,mods,combo,count100,count50,countmiss,acc,mode) {
    var stars = new calc.diff().calc({map: parser.map, mods: mods})
    var object = Number(stars.objects.length)
    var accuracy = 0
    if (mode == 1) {
        var count300 = object - count100 - count50
        accuracy = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
    } else {
        accuracy = acc
    }
    var score = {
        stars: stars,
        combo: combo,
        nmiss: countmiss,
        acc_percent: accuracy
    }
    var pp = calc.ppv2(score)
    return {star: stars,pp: pp,acc: accuracy, ar: stars.map.ar, od: stars.map.od, hp: stars.map.hp, cs: stars.map.cs}
}

bot.on("ready", (ready) => {
    async function getFile() {
        // Get User data
        var backupmessage = await bot.channels.get('487482583362568212').fetchMessages({limit: 1})
        var backup = backupmessage.first().attachments
        var fileurl = backup.first().url
        var file = await request.get(fileurl)
        cache = JSON.parse(file)
        // Get track data
        var trackmessage = await bot.channels.get('497302830558871552').fetchMessages({limit: 1})
        var trackbackup = trackmessage.first().attachments
        var trackurl = trackbackup.first().url
        var trackdata = await request.get(trackurl)
        track = JSON.parse(trackdata)
        // Get easter egg data
        var eemessage = await bot.channels.get('569168849992417315').fetchMessages({limit: 1})
        var eebackup = eemessage.first().attachments
        var eeurl = eebackup.first().url
        var eedata = await request.get(eeurl)
        storedee = JSON.parse(eedata)
    }
    getFile()

    // osutrack
    async function realtimeosutrack() {
        for (var player = 0; player < track.length ; player++) {
            console.log(track[player].osuname)
            var name = track[player].osuname
            var top50 = track[player].top50pp
            var recent = await osuApi.getUserRecent({u: name})
            if (recent.length !== 0) {
                var beatmapid = recent[0][1].id
                var count300 = Number(recent[0][0].counts['300'])
                var count100 = Number(recent[0][0].counts['100'])
                var count50 = Number(recent[0][0].counts['50'])
                var countmiss = Number(recent[0][0].counts.miss)
                var combo = recent[0][0].maxCombo
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var mod = recent[0][0].mods 
                var modandbit = mods(mod)
                var bitpresent = modandbit.bitpresent
                var parser = await precalc(beatmapid)
                var recentcalc = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                if (String(track[player].recenttimeplay) !== String(recent[0][0].date)) {
                    console.log('new recent')
                    track[player].recenttimeplay = recent[0][0].date
                    var user = await osuApi.apiCall('/get_user', {u: name})
                    if(Number(recentcalc.pp.total) > Number(top50)) {
                        var best = await osuApi.getUserBest({u: name, limit: 50})
                        for (var i = 0; i < best.length; i++) {
                            if (String(best[i][0].date) === String(recent[0][0].date)) {
                                console.log('new top play')
                                var country = String(user[0].country).toLowerCase()
                                var pp = Number(best[i][0].pp).toFixed(2)
                                var ppgain = (Number(user[0].pp_raw).toFixed(2) - Number(track[player].lasttotalpp)).toFixed(2)
                                var beatmap = best[i][1].title
                                var beatmapidfixed = best[i][1].beatmapSetId
                                var diff = best[i][1].version
                                var scores = best[i][0].score
                                var combo = best[i][0].maxCombo
                                var fc = best[i][1].maxCombo
                                var perfect = best[i][0].perfect
                                var letter = best[i][0].rank
                                var rank = rankingletters(letter)
                                var modandbit = mods(mod)
                                var shortenmod = modandbit.shortenmod
                                var bitpresent = modandbit.bitpresent
                                var count300 = Number(best[i][0].counts['300'])
                                var count100 = Number(best[i][0].counts['100'])
                                var count50 = Number(best[i][0].counts['50'])
                                var countmiss = Number(best[i][0].counts.miss)
                                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                                var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                                var star = Number(fccalc.star.total).toFixed(2)
                                var fcpp = Number(fccalc.pp.total).toFixed(2)
                                var fcacc = fccalc.acc
                                var fcguess = ``
                                if (letter == 'F') {
                                pp = 'No PP'
                                }
                                if (perfect == 0) {
                                    fcguess = `| ${fcpp}pp for ${fcacc}%`
                                }               
                                const embed = new Discord.RichEmbed()
                                .setAuthor(`New #${i+1} for ${name} in osu!Standard:`, `http://s.ppy.sh/a/${user[0].user_id}.png?date=${refresh}`)
                                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                                .setColor('#7f7fff')
                                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
**#${track[player].lastrank} → #${user[0].pp_rank} (:flag_${country}: : #${track[player].lastcountryrank} → #${user[0].pp_country_rank})** | Total PP: **${user[0].pp_raw}**`)
                                for (var i = 0; i < track[player].trackonchannel.length; i++) {
                                    var server = bot.channels.get(track[player].trackonchannel[i]).guild.id
                                    storedmapid.push({id:beatmapid,server: server})
                                    bot.channels.get(track[player].trackonchannel[i]).send({embed})
                                }
                                track[player].lasttotalpp = user[0].pp_raw
                                track[player].lastrank = user[0].pp_rank
                                track[player].lastcountryrank = user[0].pp_country_rank
                                track[player].top50pp = best[49][0].pp
                                break;
                            }
                        }
                    } else {
                        track[player].lasttotalpp = user[0].pp_raw
                        track[player].lastrank = user[0].pp_rank
                        track[player].lastcountryrank = user[0].pp_country_rank
                    }
                }
            }
        }
    }
    setInterval(realtimeosutrack, 25000)
});

bot.on("message", (message) => {
    var msg = message.content.toLowerCase();
    refresh = Math.round(Math.random()* 2147483648)
    var command = ''

    if (message.author.bot == false){
        for (var i = 0; i < msg.length; i++) {
            if (msg[i] == ' ') {
                command = msg.substring(0,i)
                break;
            } else if (msg[i+1] == undefined) {
                command = msg.substring(0,i+1)
                break;
            }
        }

        // General related

        if (msg.substring(0,5) == '!help' && msg.substring(0,5) == command) {
            try {
                var help = {
                    // General
                    'avatar': {
                        helpcommand: '!avatar (user)',
                        description: "View a user's discord avatar",
                        option: 'user: User you want to view (Has to be @user)',
                        example: '!avatar @Tienei#0000'
                    },
                    'changelog': {
                        helpcommand: '!changelog',
                        description: 'View update and fix for the bot',
                        option: 'None',
                        example: '!changelog'
                    },
                    'help': {
                        helpcommand: '!help (command)',
                        description: 'Get a full command list or view a specific command help',
                        option: 'command: Command help you wanted to see',
                        example: '!help osu'
                    },
                    'ping': {
                        helpcommand: '!ping',
                        description: 'Ping Bancho (probably making Bancho mad sometimes lol)',
                        option: 'None',
                        example: '!ping'
                    },
                    'report': {
                        helpcommand: '!report (error)',
                        description: 'Report an error or bug to the owner',
                        option: 'error: Type any error or bug you found',
                        example: '!report osu is broken'
                    },
                    'ee': {
                        helpcommand: '!ee',
                        description: 'View how many easter eggs you have',
                        option: 'None',
                        example: '!ee'
                    },
                    // Fun
                    'hug': {
                        helpcommand: '!hug (user)',
                        description: 'Hug someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!hug Tienei'
                    },
                    'cuddle': {
                        helpcommand: '!cuddle (user)',
                        description: 'Cuddle someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!cuddle Tienei'
                    },
                    'slap': {
                        helpcommand: '!slap (user)',
                        description: 'Slap someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!slap Tienei'
                    },
                    'kiss': {
                        helpcommand: '!kiss (user)',
                        description: 'Kiss someone (best not to kiss in public ;) )',
                        option: 'user: The name of the user (Discord)',
                        example: '!kiss Tienei'
                    },
                    // Osu
                    'osu': {
                        helpcommand: '!osu (username) (options)',
                        description: 'Get an osu!Standard profile',
                        option: 'username: osu!username of the player (Space replaced with "_")\nDetailed `(-d)`: Get all the details of the player `(no param)`',
                        example: '!osu Tienei -d'
                    },
                    'taiko': {
                        helpcommand: '!taiko (username)',
                        description: 'Get an osu!Taiko profile',
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!taiko Tienei'
                    },
                    'ctb': {
                        helpcommand: '!ctb (username)',
                        description: 'Get an osu!Catch the beat profile',
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!ctb Tienei'
                    },
                    'mania': {
                        helpcommand: '!mania (username)',
                        description: 'Get an osu!Mania profile',
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!mania Tienei'
                    },
                    'osutop': {
                        helpcommand: '!osutop (username) (options)',
                        description: "View a player's osu!Standard top play",
                        option: 'username: osu!username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play: `(-m)`: Get a top mods play from top 100 `(Shorten mods)`',
                        example: '!osutop Tienei -m HDHR'
                    },
                    'taikotop': {
                        helpcommand: '!taikotop (username) (options)',
                        description: "View a player's osu!Taiko top play",
                        option: 'username: osu!username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!taikotop Tienei -p 8'
                    },
                    'ctbtop': {
                        helpcommand: '!ctbtop (username) (options)',
                        description: "View a player's osu!Catch the beat top play",
                        option: 'username: osu!username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!ctbtop Tienei -p 9'
                    },
                    'maniatop': {
                        helpcommand: '!maniatop (username) (options)',
                        description: "View a player's osu!Mania top play",
                        option: 'username: osu!username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!maniatop Tienei -p 4'
                    },
                    'osutrack': {
                        helpcommand: '!osutrack (username)',
                        description: "Track a player's osu!Standard top 50",
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!osutrack Tienei'
                    },
                    'untrack': {
                        helpcommand: '!untrack (username)',
                        description: "Untrack a player from the database",
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!untrack Tienei'
                    },
                    'recent': {
                        helpcommand: '![recent|r] (username) (options)',
                        description: "Get player's most recent play",
                        option: 'username: osu!username of the player (Space replaced with "_")\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`',
                        example: '!r Tienei -b'
                    },
                    'compare': {
                        helpcommand: '![compare|c] (username) ',
                        description: "Compare to the last play in the chat",
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!c Tienei'
                    },
                    'osuset': {
                        helpcommand: '!osuset (username)',
                        description: 'Link your profile to an osu! player',
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!osuset Tienei'
                    },
                    'osuavatar': {
                        helpcommand: '!osuavatar (username)',
                        description: "Get player's osu! avatar",
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!osuavatar Tienei'
                    },
                    'osusig': {
                        helpcommand: '!osusig (username)',
                        description: "Generate a signature of a player's profile",
                        option: 'username: osu!username of the player (Space replaced with "_")',
                        example: '!osusig Tienei'
                    },
                    'map': {
                        helpcommand: '![map|m] (options)',
                        description: "Get details info of the map of the last play in the server",
                        option: 'Mods: details info of the map with mods `(Shorten mods)`',
                        example: '!m HDDT'
                    },
                    'calcpp': {
                        helpcommand: '!calcpp (map id) (mods) (acc) (combo) (miss)',
                        description: "Calculate a play's pp",
                        option: '**Needs all options to be calculated**',
                        example: '!calcpp 1157868 nomod 100 1642 0'
                    },
                    'scores': {
                        helpcommand: '!scores (map link) (username)',
                        description: "Get player's play on a specific map",
                        option: 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_")',
                        example: '!scores https://osu.ppy.sh/b/1157868 Cookiezi'
                    },
                    'acc': {
                        helpcommand: '!acc (300) (100) (50) (miss)',
                        description: "Accuracy calculator",
                        option: '**Needs all options to be calculated**',
                        example: '!acc 918 23 2 0'
                    },
                    'rec': {
                        helpcommand: '!rec',
                        description: "Recommends you an osu beatmap",
                        option: 'None',
                        example: '!rec'
                    },
                    //Akatsuki
                    'akatsuki': {
                        helpcommand: '!akatsuki (username) (options)',
                        description: 'Get an Akatuski Standard profile',
                        option: 'username: Akatsuki username of the player (Space replaced with "_")\nDetails `(-d)`: Get all the details of the player `(no param)`',
                        example: '!akatsuki Tienei -d'
                    },
                    'akatr': {
                        helpcommand: '!akatr (username)',
                        description: "Get player's most recent play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_")',
                        example: '!akatr Tienei'
                    },
                    'akattop': {
                        helpcommand: '!akattop (username) (options)',
                        description: "View a player's Akatsuki Standard top play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!akattop Tienei -p 8'
                    },
                    'akatavatar': {
                        helpcommand: '!akatavatar (username)',
                        description: "Get player's Akatsuki avatar",
                        option: 'username: Akatsuki username of the player (Space replaced with "_")',
                        example: '!akatavatar Tienei'
                    },
                    // Ripple
                    'ripple': {
                        helpcommand: '!ripple (username) (options)',
                        description: 'Get an  Ripple Standard profile',
                        option: 'username: Ripple username of the player (Space replaced with "_")\nDetailed `(-d)`: Get all the detailed of the player `(no param)`',
                        example: '!ripple Tienei -d'
                    },
                    'rippler': {
                        helpcommand: '!rippler (username)',
                        description: "Get player's most recent play",
                        option: 'username: Ripple username of the player (Space replaced with "_")',
                        example: '!rippler Tienei'
                    },
                    'rippletop': {
                        helpcommand: '!rippletop (username) (options)',
                        description: "View a player's Ripple Standard top play",
                        option: 'username: Ripple username of the player (Space replaced with "_")\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!rippletop Tienei -p 8'
                    },
                    'rippleavatar': {
                        helpcommand: '!rippleavatar (username)',
                        description: "Get player's Ripple avatar",
                        option: 'username: Ripple username of the player (Space replaced with "_")',
                        example: '!rippleavatar Tienei'
                    }
                }
                var generalhelp = '**--- [General]:**\n`!avatar` `!changelog` `!help` `!ping` `!report` `!ee`'
                var funhelp = '**--- [Fun]:**\n`!hug` `!cuddle` `!slap` `!kiss`'
                var osuhelp = '**--- [osu!]:**\n`!osu` `!taiko` `!ctb` `!mania` `!osutop` `!taikotop` `!ctbtop` `!maniatop` `!osutrack` `!untrack` `!map` `!osuset` `!osuavatar` `!osusig` `!recent` `!compare` `!calcpp` `!scores` `!acc` `!rec`'
                var akatsukihelp = '**--- [Akatsuki]:**\n`!akatsuki` `!akatr` `!akatavatar` `!akattop`'
                var ripplehelp = '**--- [Ripple]:**\n`!ripple` `!rippler` `!rippleavatar` `!rippletop`'
                var text = ''
                if (msg.substring(6) == '') {
                    text = `${generalhelp}\n\n${funhelp}\n\n${osuhelp}\n\n${akatsukihelp}\n\n${ripplehelp}`
                } else {
                    var getcmd = msg.substring(6)
                    if (help[getcmd] == undefined) {
                        throw 'No command was found!'
                    }
                    if (getcmd == 'r') {
                        getcmd = 'recent'
                    }
                    if (getcmd == 'c') {
                        getcmd = 'compare'
                    }
                    if (getcmd == 'm') {
                        getcmd = 'map'
                    }
                    text = '```' + help[getcmd].helpcommand + '```' + `\n${help[getcmd].description}\n\n**---[Options]:**\n${help[getcmd].option}\n\n**---[Example]:**\n` + help[getcmd].example
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Commands for Tiny Bot pre-v3`)
                .setThumbnail(bot.user.avatarURL)
                .setDescription(text)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if(msg.substring(0,7) == '!credit' && msg.substring(0,7) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Special thanks to:`)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**--- Special helper ❤:**
Great Fog (!m, partial !osud, !acc, total pp in !osud, v3)

**--- Command idea from:**
Yeong Yuseong (!calcpp, !compare sorted by pp, !r Map completion), 1OneHuman (!mosutop, !rosutop, !scores), Shienei (!c Unranked pp calculation), jpg (Time ago)

**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul`)
            message.channel.send({embed})
        }

        if(msg.substring(0,7) == '!avatar' && msg.substring(0,7) == command) {
            var image = ''
            var username = ''
            if (msg.substring(8) == '') {
                image = message.author.avatarURL    
                username = message.author.username
            } else {
                user = message.mentions.users.first()
                if (user !== undefined) {
                    image = user.avatarURL
                    username = user.username
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setImage(image)
            message.channel.send({embed})
        }

        if (msg.substring(0,10) == '!changelog' && msg.substring(0,10) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Changelog for Tiny Bot pre-v3.0`)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**Bot has been re-written and updated to pre-v3! That mean the bot will be somewhat faster and a lot less buggy**
- Added error detecting
- Added !akatop, !rippletop
- Updated osu tracking
- Added !report
- Added easter egg
- Added !recent -b
- Redesign !help
- Added !hug, !cuddle, !slap, !kiss
- Added !rec (recommendation)`)
            message.channel.send({embed})
        }

        if (msg.substring(0,5) == '!ping' && msg.substring(0,5) == command) {
            async function Bancho() {
                var timenow = Date.now()
                var test = await osuApi.getUser({u: "peppy"})
                var timelater = Date.now()
                message.channel.send(`Bancho respond! **${timelater - timenow}ms**`)
            }
            Bancho()
        }

        if (msg.substring(0,7) == '!report' && msg.substring(0,7) == command && message.guild !== null) {
            var error = message.content.substring(8)
            var channelid = message.channel.id
            var user = message.author.username
            var pfp = message.author.avatarURL
            const embed = new Discord.RichEmbed()
            .setAuthor(`Username: ${user}`, pfp)
            .setColor('#7f7fff')
            .setDescription(`
Channel ID: **${channelid}**
Problem: ${error}`)
            bot.channels.get('564396177878155284').send({embed})
            message.channel.send('Error has been reported')
        }

        if (msg.substring(0,8) == '!respond' && msg.substring(0,8) == command && message.author.id == "292523841811513348") {
            var start = 9
            var error = ''
            var channelid = ''
            var statuscode = ''
            var defindcode = {
                0: 'Fixed',
                1: 'Currently being fixed',
                2: 'Unfixable',
                3: 'Spam'
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == '"') {
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == '"') {
                    error = message.content.substring(start,i)
                    start = i + 2
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    channelid = msg.substring(start,i)
                    start = i + 1
                    break
                }
            }
            for (var i = start; i <= msg.length; i++) {
                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                    statuscode = msg.substring(start,i)
                    break
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`${message.author.username} respond`, message.author.avatarURL)
            .setColor('#7f7fff')
            .setDescription(`
Error: ${error}
Status: **${defindcode[statuscode]}**`)
            bot.channels.get(channelid).send({embed})
        }

        if (msg.includes(`<@${bot.user.id}>`) == true || msg.includes(`<@!${bot.user.id}>`) == true) {
            var roll = Math.floor(Math.random()*6)
            var respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,`Why you keep pinging me?`,`Stop pinging me! <:chinoangry:450686707881213972>`,`What do you need senpai? <:chinohappy:450684046129758208>`,`<:chinopinged:450680698613792783>`]
            message.channel.send(respone[roll])
        }

        // Easter Egg

        if (msg.substring(0,3) == '!ee' && msg.substring(0,3) == command) {
            if (storedee[message.author.id] !== undefined) {
                var number = storedee[message.author.id]
                message.channel.send(`You have found: **${number.match(/1/g).length} easter egg(s)**`)
            } else {
                message.channel.send("You haven't found any!")
            }
        }

        if (ee[msg] !== undefined) {
            var number = "0000"
            if (storedee[message.author.id] == undefined) {
                storedee[message.author.id] = number
            }
            if (storedee[message.author.id].length < 4) {
                storedee[message.author.id] = storedee[message.author.id].substring(0, storedee[message.author.id].length) + number.substring(storedee[message.author.id].length)
            }
            if (storedee[message.author.id].substring(ee[msg].bit, ee[msg].bit + 1) == '0') {
                storedee[message.author.id] = storedee[message.author.id].substring(0, ee[msg].bit) + "1" + storedee[message.author.id].substring(ee[msg].bit + 1)
                fs.writeFileSync('ee.txt', JSON.stringify(storedee))
                bot.channels.get('569168849992417315').send({files: [{
                    attachment: './ee.txt',
                    name: 'ee.txt'
                }]})
            }
            if (ee[msg].type == "normal") {
                message.channel.send(ee[msg].respond)   
            }
        }

        // Fun related

        async function tenor(start, search, action, aloneaction) {
           try {
                var text = ''
                if (msg.substring(start) !== '') {
                    if (msg.substring(start).includes('@') == true) {
                        var id = message.mentions.users.first().id
                        text = `<@${id}>, ${action} <@${message.author.id}>`
                    } else if (message.guild !== null) {
                        var member = message.guild.members.array()
                        for (var i = 0; i < message.guild.memberCount; i++) {
                            if (member[i].nickname !== null) {
                                if (member[i].nickname.substring(0, msg.length - start).toLowerCase() == msg.substring(start)) {
                                    var id = member[i].id
                                    text = `<@${id}>, ${action} <@${message.author.id}>`
                                    break
                                }
                            } else {
                                if (member[i].user.username.substring(0, msg.length - start).toLowerCase() == msg.substring(start)) {
                                    var id = member[i].id
                                    text = `<@${id}>, ${action} <@${message.author.id}>`
                                    break
                                }
                            }
                        }
                    }
                } else {
                    text = aloneaction
                }
                if (text == '') {
                    throw 'No user was found!'
                }
                var data = await request.get(`https://api.tenor.com/v1/search?q=${search}&key=LIVDSRZULELA&limit=10&media_filter=minimal`)
                var gif = JSON.parse(data)
                const embed = new Discord.RichEmbed()
                .setDescription(text)
                .setImage(gif.results[Math.floor(Math.random()*9)].media[0].gif.url)
                message.channel.send({embed})
           } catch (error) {
               message.channel.send(String(error))
           }
        }

        if (msg.substring(0,4) == '!hug' && msg.substring(0,4) == command) {
            tenor(5, 'anime hug', 'you got a hug from', 'Sorry to see you alone...')
        }
        if (msg.substring(0,7) == '!cuddle' && msg.substring(0,7) == command) {
            tenor(8, 'anime cuddle', 'you got a cuddle from', 'Sorry to see you alone...')
        }
        if (msg.substring(0,5) == '!slap' && msg.substring(0,5) == command) {
            tenor(6, 'anime slap', 'you got a slap from', 'Are you trying to slap yourself?')
        }
        if (msg.substring(0,5) == '!kiss' && msg.substring(0,5) == command) {
            tenor(6, 'anime kiss', 'you got a kiss from', 'Are you trying to kiss yourself?')
        }

        // Osu related

        var urlcommand = false
        
        function checkplayer(name) {
            if (name == '') {
                var osuname = ''
                if (cache[message.author.id] !== undefined) {
                    osuname = cache[message.author.id].osuname
                    return osuname
                } else {
                    return name
                }
            } else {
                var osuname = ''
                var id = ''
                if (name.includes('@') == true) {
                   var id = message.mentions.users.first().id
                   if (cache[id] !== undefined) {
                        osuname = cache[id].osuname
                        return osuname
                   } else {
                        return name
                   }
                } else {
                    return name
                }

            }
        }

        async function osu(start,mode) {
            try {
                var d = msg.includes('-d')
                var check = ''
                if (msg.indexOf('-d') !== start && d !== false) {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            check = msg.substring(start, i)
                            break
                        }
                    }
                } else if (msg.indexOf('-d') == start) {
                    check = ''
                } else {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            check = msg.substring(start, i+1)
                            break
                        }
                    }
                }
                var name = checkplayer(check)
                if (d == true && mode == 0) {
                    var user = await osuApi.getUser({u: name, event_days: 31})
                    var best = await osuApi.getUserBest({u: name, limit: 50})
                    var event = ``
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var acc_avg = 0
                    var bpm_avg = 0
                    var cs_avg = 0
                    var ar_avg = 0
                    var od_avg = 0
                    var hp_avg = 0
                    var username = user.name
                    var acc = Number(user.accuracy).toFixed(2)
                    var userid = user.id
                    var pp = Number(user.pp.raw).toFixed(2);
                    var playcount = user.counts.plays
                    var rank = user.pp.rank
                    var countryrank = user.pp.countryRank
                    var country = user.country.toLowerCase();
                    var level = user.level
                    var rankedscore = user.scores.ranked
                    var totalscore = user.scores.total
                    var ss = Number(user.counts.SS) + Number(user.counts.SSH)
                    var s = Number(user.counts.S) + Number(user.counts.SH)
                    var a = Number(user.counts.A)
                    var totalrank = ss + s + a
                    var events = 0
                    if (user.events.length > 3) {
                        events = 3
                    } else {
                        events = user.events.length
                    }
                    for (var i = 0; i < events; i++) {
                        var text = user.events[i].html.replace(/(<([^>]+)>)/ig,"")
                        event += `\n ${text}`
                    }
                    for (var i = 0; i < 50; i++) {
                        var beatmapid = best[i][1].id
                        var mod = best[i][0].mods
                        var modandbit = mods(mod)
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = ppcalc(parser,modandbit.bitpresent,0,0,0,0,0,0)
                        var detail = mapdetail(modandbit.shortenmod,0,Number(best[i][1].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                        speed_avg += thing.star.speed * (Math.pow(detail.bpm, 0.2) / Math.pow(180, 0.2))
                        acc_avg += (Math.pow(scoreacc, 3)/Math.pow(100, 3)) * 1.1 * thing.star.total * (Math.pow(detail.od, 0.05) / (Math.pow(6, 0.05)))
                        bpm_avg += detail.bpm
                        cs_avg += detail.cs
                        ar_avg += detail.ar
                        od_avg += detail.od
                        hp_avg += detail.hp
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`osu! Statistics for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(`***Performance:***
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank}) | ***${pp}pp***
**Level:** ${level}
**Accuracy:** ${acc}%
**Playcount:** ${playcount}
**Ranked Score:** ${rankedscore} | **Total Score:** ${totalscore}
<:rankingX:520932410746077184>: ${ss} (${Number(ss/totalrank*100).toFixed(2)}%) | <:rankingS:520932426449682432>: ${s} (${Number(s/totalrank*100).toFixed(2)}%) | <:rankingA:520932311613571072>: ${a} (${Number(a/totalrank*100).toFixed(2)}%)
        
***${username} recent events:***
${event}
        
***${username} average skill:***
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2) *2}★
Speed skill: ${Number(speed_avg/50).toFixed(2) *2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}`)
                    message.channel.send({embed});
                } else {
                    var user = await osuApi.getUser({u: name, m: mode})
                    var modename = ''
                    if (mode == 0) {
                        modename = 'Standard'
                    } else if (mode == 1) {
                        modename = 'Taiko'
                    } else if (mode == 2) {
                        modename = 'CTB'
                    } else if (mode == 3) {
                        modename = 'Mania'
                    }
                    var username = user.name
                    if (username == undefined) {
                        throw 'User not found!'
                    }
                    var acc = Number(user.accuracy).toFixed(2)
                    var id = user.id
                    var pp = Number(user.pp.raw).toFixed(2);
                    var played = user.counts.plays
                    var rank = user.pp.rank
                    var countryrank = user.pp.countryRank
                    var country = user.country.toLowerCase();
                    var level = user.level
                    var ss = Number(user.counts.SS) + Number(user.counts.SSH)
                    var s = Number(user.counts.S) + Number(user.counts.SH)
                    var a = user.counts.A

                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Osu!${modename} status for: ${username}`,'',`https://osu.ppy.sh/users/${id}`)
                    .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
                
<:rankingX:520932410746077184>: ${ss}  <:rankingS:520932426449682432>: ${s}  <:rankingA:520932311613571072>: ${a} `)
                    .setThumbnail(`http://s.ppy.sh/a/${id}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osusig() {
            var check = message.content.substring(8)
            var name = checkplayer(check)
            const embed = new Discord.RichEmbed()
            .setAuthor(`Signature for ${name}`)
            .setImage(`http://lemmmy.pw/osusig/sig.php?colour=pink&uname=${name}&pp=2&countryrank&onlineindicator=undefined&xpbar&xpbarhex&date=${refresh}`)
            message.channel.send({embed})
        }

        async function osuavatar() {
            var name = message.content.substring(11)
            var user = await osuApi.apiCall('/get_user', {u: name})
            var username = user[0].username
            var id = user[0].user_id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setImage(`https://a.ppy.sh/${id}_1?date=${refresh}.png`)
            message.channel.send({embed})
        }

        async function osuset() {
            var osuname = message.content.substring(8)
            var user = await osuApi.getUser({u: osuname})
            var name = user.name
            if (name == undefined) {
                throw 'Please enter a valid osu username! >:c'
            } else {
                if (cache.length = 0) {
                    cache[message.author.id] = {osuname: name}
                }
                if (cache[message.author.id] !== undefined) {
                    cache[message.author.id].osuname = name
                } else {
                    cache[message.author.id] = {osuname: name}
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Your account has been linked to osu! username: ${name}`,'',`https://osu.ppy.sh/users/${user.id}`)
                .setImage(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                message.channel.send({embed})
                fs.writeFileSync('data.txt', JSON.stringify(cache))
                bot.channels.get('487482583362568212').send({files: [{
                    attachment: './data.txt',
                    name: 'data.txt'
                }]})
            }
        }

        async function recent(start) {
            try {
                var b = msg.includes('-b')
                var check = ''
                if (msg.indexOf('-b') !== start && b !== false) {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            check = msg.substring(start, i)
                            break
                        }
                    }
                } else if (msg.indexOf('-b') == start) {
                    check = ''
                } else {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            check = msg.substring(start, i+1)
                            break
                        }
                    }
                }
                var name = checkplayer(check)
                if (b == true) {
                    var best = await osuApi.getUserBest({u: name, limit:100})
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i][0].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a[0].date)
                        b1 = Date.parse(b[0].date)
                        return b1 - a1
                    })
                    var title = best[0][1].title
                    var diff = best[0][1].version
                    var beatmapid = best[0][1].id
                    var beatmapidfixed = best[0][1].beatmapSetId
                    var score = best[0][0].score
                    var count300 = Number(best[0][0].counts['300'])
                    var count100 = Number(best[0][0].counts['100'])
                    var count50 = Number(best[0][0].counts['50'])
                    var countmiss = Number(best[0][0].counts.miss)
                    var combo = best[0][0].maxCombo
                    var fc = best[0][1].maxCombo
                    var letter = best[0][0].rank
                    var rank = rankingletters(letter)
                    var pp = Number(best[0][0].pp).toFixed(2)
                    var mod = best[0][0].mods
                    var perfect = best[0][0].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(best[0][0].date)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var parser = await precalc(beatmapid)     
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${best[0][0].top} osu!Standard play for ${username}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor('#7f7fff')
                    .setDescription(`
**[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`)
                    message.channel.send({embed})
                } else {
                    var recent = await osuApi.getUserRecent({u: name, limit: 1})
                    if (recent.length == 0) {
                        throw 'No play found within 24 hours of this user **-Tiny**'
                    }
                    var getplayer = await osuApi.getUser({u: name})
                    var beatmapidfixed = recent[0][1].beatmapSetId
                    var beatmapid = recent[0][1].id
                    var scores = recent[0][0].score
                    var userid = recent[0][0].user.id
                    var beatmap = recent[0][1].title
                    var diff = recent[0][1].version
                    var count300 = Number(recent[0][0].counts['300'])
                    var count100 = Number(recent[0][0].counts['100'])
                    var count50 = Number(recent[0][0].counts['50'])
                    var countmiss = Number(recent[0][0].counts.miss)
                    var combo = recent[0][0].maxCombo   
                    var fc = recent[0][1].maxCombo
                    var mod = recent[0][0].mods
                    var letter = recent[0][0].rank
                    var rank = rankingletters(letter)
                    var perfect = recent[0][0].perfect
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(recent[0][0].date)
                    var parser = await precalc(beatmapid)
                    var recentcalc = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                    var star = Number(recentcalc.star.total).toFixed(2)
                    var pp = Number(recentcalc.pp.total).toFixed(2)
                    var nopp = ''
                    var end = recentcalc.star.objects[recentcalc.star.objects.length - 1].obj.time - recentcalc.star.objects[0].obj.time
                    var point = recentcalc.star.objects[count300 + count100 + count50 + countmiss - 1].obj.time - recentcalc.star.objects[0].obj.time
                    var mapcomplete = Number((point / end) * 100).toFixed(2)
                    var mapcompleted = ''
                    var osuname = getplayer.name
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var fcguess = ``
                    if (letter == 'F') {
                        nopp = '(No pp)'
                        mapcompleted = `**Map Completion:** ${mapcomplete}%`
                        date = '| ' + date
                    }
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Most recent osu! Standard play for ${osuname}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor('#7f7fff')
                    .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp*** ${nopp}
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${mapcompleted} ${date}
`)
                    message.channel.send({embed})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function compare(start) {
            try {
                var check = message.content.substring(start);
                var name = checkplayer(check)
                var storedid = 0
                for (var i = storedmapid.length -1 ; i > -1; i--) {
                    if (message.guild !== null) {
                        if (storedmapid[i].server !== undefined) {
                            if (message.guild.id == storedmapid[i].server) {
                                storedid = storedmapid[i].id
                                break;
                            }
                        }
                    } else {
                        if (storedmapid[i].user !== undefined) {
                            if (message.author.id == storedmapid[i].user) {
                                storedid = storedmapid[i].id
                                break;
                            }
                        }
                    }
                }
                var scores = await osuApi.getScores({b: storedid, u: `${name}`})
                scores.sort(function (a,b) {
                    a1 = Number(a.pp)
                    b1 = Number(b.pp)
                    return b1 - a1
                })
                if (scores.length == 0) {
                    throw `${name} didn't play this map! D: **-Tiny**`
                }
                var beatmap = await osuApi.getBeatmaps({b: storedid})
                var highscore = ''
                var beatmapname = beatmap[0].title
                var diff = beatmap[0].version
                var beatmapimageid = beatmap[0].beatmapSetId
                var osuname = scores[0].user.name
                var osuid = scores[0].user.id
                var parser = await precalc(storedid)
                for (var i = 0; i <= scores.length - 1; i++) {
                    var score = scores[i].score
                    var count300 = Number(scores[i].counts['300'])
                    var count100 = Number(scores[i].counts['100'])
                    var count50 = Number(scores[i].counts['50'])
                    var countmiss = Number(scores[i].counts.miss)
                    var combo = scores[i].maxCombo
                    var fc = beatmap[0].maxCombo
                    var letter = scores[i].rank
                    var rank = rankingletters(letter)
                    var mod = scores[i].mods
                    var perfect = scores[i].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(scores[i].date)
                    var pp = Number(scores[i].pp).toFixed(2)
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var unrankedpp = ''
                    if (beatmap[0].approvalStatus !== "Ranked" && beatmap[0].approvalStatus !== "Approved") {
                        var comparepp = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                        unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                        highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${pp}pp*** ${unrankedpp}
${rank} **Score:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`         
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}]`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutop(mode, start) {
            try {
                var p = msg.includes('-p')
                var r = msg.includes('-r')
                var m = msg.includes('-m')
                var check = ''
                var top = ''
                var modename = ''
                if ((msg.indexOf('-p') !== start && p !== false) || (msg.indexOf('-r') !== start &&  r !== false) || (msg.indexOf('-m') !== start && m !== false)) {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            check = msg.substring(start, i)
                            break
                        }
                    }
                } else if (msg.indexOf('-p') == start || msg.indexOf('-r') == start || msg.indexOf('-m') == start) {
                    check = ''
                } else {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            check = msg.substring(start, i+1)
                            break
                        }
                    }
                }
                var name = checkplayer(check)
                if (p == true && m == false && r == false) {
                    var n = 0
                    for (var i = msg.indexOf('-p') + 3; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            n = Number(msg.substring(msg.indexOf('-p') + 3, i+1)) -1
                            break
                        }
                    }
                    var best = await osuApi.getUserBest({u: name, limit: n+1, m: mode})
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    var title = best[n][1].title
                    var diff = best[n][1].version
                    var beatmapid = best[n][1].id
                    var score = best[n][0].score
                    var count300 = Number(best[n][0].counts['300'])
                    var count100 = Number(best[n][0].counts['100'])
                    var count50 = Number(best[n][0].counts['50'])
                    var countmiss = Number(best[n][0].counts.miss)
                    var countgeki = Number(best[n][0].counts.geki)
                    var countkatu = Number(best[n][0].counts.katu)
                    var combo = best[n][0].maxCombo
                    var fc = best[n][1].maxCombo
                    var letter = best[n][0].rank
                    var rank = rankingletters(letter)
                    var pp = Number(best[n][0].pp).toFixed(2)
                    var mod = best[n][0].mods
                    var perfect = best[n][0].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(best[n][0].date)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var star = 0
                    var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                    if (mode == 0) {
                        modename = 'Standard'
                        var parser = await precalc(beatmapid)
                        var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        star = Number(fccalc.star.total).toFixed(2)
                    }
                    if (mode == 1 || mode == 2 || mode == 3) {
                        fc = ''
                        star = Number(best[n][1].difficulty.rating).toFixed(2)
                    }
                    if (mode == 1) {
                        modename = 'Taiko'
                        acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100).toFixed(2)
                        accdetail = `[${count300}/${count100}/${countmiss}]`
                    }
                    if (mode == 2) {
                        modename = 'CTB'
                        acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100).toFixed(2)
                    }
                    if (mode == 3) {
                        modename = 'Mania'
                        acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100).toFixed(2)
                        accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                    }
                    var fcguess = ''
                    if (perfect == 0 && mode == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    top += `
${n+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail} ${fcguess}
${date}
`   
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (r == true && p == false && m == false && mode == 0) {
                    var best = await osuApi.getUserBest({u: name, limit:100})
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i][0].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a[0].date)
                        b1 = Date.parse(b[0].date)
                        return a1 - b1
                    })
                    for (var i = best.length-1; i > best.length - 6; i--) {
                        var title = best[i][1].title
                        var diff = best[i][1].version
                        var beatmapid = best[i][1].id
                        var score = best[i][0].score
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var combo = best[i][0].maxCombo
                        var fc = best[i][1].maxCombo
                        var letter = best[i][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[i][0].pp).toFixed(2)
                        var mod = best[i][0].mods
                        var perfect = best[i][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[i][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)     
                        var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        var star = Number(fccalc.star.total).toFixed(2)
                        var fcguess = ''
                        if (perfect == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${best[i][0].top}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!Standard most recent plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (m == true && p == false && r == false && mode == 0) {
                    var mod = []
                    var getmod = ''
                    var definemod = {
                        nf: 'NoFail',
                        ez: 'Easy',
                        td: 'TouchDevice',
                        hd: 'Hidden',
                        hr: 'HardRock',
                        sd: 'SuddenDeath',
                        dt: 'DoubleTime',
                        rx: 'Relax',
                        ht: 'HalfTime',
                        nc: 'Nightcore',
                        fl: 'Flashlight',
                        so: 'SpunOut',
                        nomod: 'No Mod'
                    }
                    for (var i = msg.indexOf('-m') + 3; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            getmod = msg.substring(msg.indexOf('-m') + 3, i+1)
                            break
                        }
                    }
                    for (var i = 0; i < getmod.length; i=i+2) {
                        if (definemod[getmod.substring(i, i+2)]) {
                            mod.push(definemod[getmod.substring(i, i+2)])
                        }
                        if (definemod[getmod.substring(i, i+5)]) {
                            mod.push(definemod[getmod.substring(i, i+5)])
                        }
                    }
                    var best = await osuApi.getUserBest({u: name, limit: 100})
                    var user = await osuApi.getUser({u: name})
                    var checktop = 0
                    var userid = best[0][0].user.id
                    var username = user.name
                    for (var i = 0; i < best.length; i++) {
                        var bestmod = best[i][0].mods
                        var match = false
                        if (mod.includes('No Mod') == true) {
                            if (bestmod.length == 0){
                                match = true
                            } else {match = false}
                        } else {
                            for (var m1 = 0; m1 < mod.length; m1++) {
                                if (bestmod.includes(mod[m1]) == true) {               
                                    match = true
                                } else { 
                                    match = false
                                    break; 
                                }
                                
                            }
                        }
                        if (match == true && checktop < 5) {
                            checktop += 1
                            var title = best[i][1].title
                            var diff = best[i][1].version
                            var beatmapid = best[i][1].id
                            var score = best[i][0].score
                            var count300 = Number(best[i][0].counts['300'])
                            var count100 = Number(best[i][0].counts['100'])
                            var count50 = Number(best[i][0].counts['50'])
                            var countmiss = Number(best[i][0].counts.miss)
                            var combo = best[i][0].maxCombo
                            var fc = best[i][1].maxCombo
                            var letter = best[i][0].rank
                            var rank = rankingletters(letter)
                            var pp = Number(best[i][0].pp).toFixed(2)
                            var perfect = best[i][0].perfect
                            var modandbit = mods(bestmod)
                            var shortenmod = modandbit.shortenmod
                            var bitpresent = modandbit.bitpresent
                            var date = timeago(best[i][0].date)
                            if (message.guild !== null) {
                                storedmapid.push({id:beatmapid,server:message.guild.id})
                            } else {
                                storedmapid.push({id:beatmapid,user:message.author.id})
                            }
                            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                            var parser = await precalc(beatmapid)
                            var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            var star = Number(fccalc.star.total).toFixed(2)
                            var fcguess = ''
                            if (perfect == 0) {
                                fcguess = `| **${fcpp}pp for ${fcacc}%**`
                            }
                            top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                        }
                    }
                    if (top.length == 0) {
                        top += `This user doesn't have any ${getmod.toUpperCase()} top play`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!Standard Plays with ${getmod.toUpperCase()} for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(top)
                    message.channel.send({embed});
                } else {
                    var best = await osuApi.getUserBest({u: name, limit: 5, m: mode})
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    for (var i = 0; i < 5; i++) {
                        var title = best[i][1].title
                        var diff = best[i][1].version
                        var beatmapid = best[i][1].id
                        var score = best[i][0].score
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var countgeki = Number(best[i][0].counts.geki)
                        var countkatu = Number(best[i][0].counts.katu)
                        var combo = best[i][0].maxCombo
                        var fc = best[i][1].maxCombo
                        var letter = best[i][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[i][0].pp).toFixed(2)
                        var mod = best[i][0].mods
                        var perfect = best[i][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[i][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var star = 0
                        var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                        if (mode == 0) {
                            var parser = await precalc(beatmapid)
                            var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1 || mode == 2 || mode == 3) {
                            fc = ''
                            star = Number(best[i][1].difficulty.rating).toFixed(2)
                        }
                        if (mode == 1) {
                            acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100).toFixed(2)
                            accdetail = `[${count300}/${count100}/${countmiss}]`
                        }
                        if (mode == 2) {
                            acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100).toFixed(2)
                        }
                        if (mode == 3) {
                            acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100).toFixed(2)
                            accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                        }
                        var fcguess = ''
                        if (perfect == 0 && mode == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail} ${fcguess}
${date}
`   
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(top)
                    message.channel.send({embed});
                }
            } catch (error) {
                console.log(String(error))
            }
        }

        async function map(start){
            try {
                var beatmapid = 0
                var mods = []
                if (msg.substring(start) == "") {
                    mods.push('No Mod')
                } else {
                    mods.push(msg.substring(start))
                }
                var bitpresent = 0
                for (var i = storedmapid.length -1 ; i > -1; i--) {
                    if (message.guild !== null) {
                        if (storedmapid[i].server !== undefined) {
                            if (message.guild.id == storedmapid[i].server) {
                                beatmapid = storedmapid[i].id
                                break;
                            }
                        }
                    } else {
                        if (storedmapid[i].user !== undefined) {
                            if (message.author.id == storedmapid[i].user) {
                                beatmapid = storedmapid[i].id
                                break;
                            }
                        }
                    }
                }
                var mod = {
                    nf: 1,
                    ez: 2,
                    td: 4,
                    hd: 8,
                    hr: 16,
                    dt: 64,
                    rx: 128,
                    ht: 256,
                    nc: 512,
                    fl: 1024,
                    so: 4096
                }
                var validmod = false
                for (var m = 0; m <= mods[0].length; m++) {
                    if (mod[mods[0].substr(m*2,2)]) {
                        bitpresent += mod[mods[0].substr(m*2,2)]
                        validmod = true
                    }
                }
                if (validmod == false) {
                    mods[0] = 'No Mod'
                }
                var map = await osuApi.getBeatmaps({b: beatmapid})
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                var maxCombo = map[0].maxCombo
                var parser = await precalc(beatmapid)
                var acc95 = ppcalc(parser,bitpresent,maxCombo,0,0,0,95,0)
                var acc97 = ppcalc(parser,bitpresent,maxCombo,0,0,0,97,0)
                var acc99 = ppcalc(parser,bitpresent,maxCombo,0,0,0,99,0)
                var acc100 = ppcalc(parser,bitpresent,maxCombo,0,0,0,100,0)
                var detail = mapdetail(mods[0],map[0].time.total,map[0].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                var totallength = Number(detail.length).toFixed(0)
                var bpm = Number(detail.bpm).toFixed(0)
                var ar = Number(detail.ar).toFixed(2)
                var od = Number(detail.od).toFixed(2)
                var hp = Number(detail.hp).toFixed(2)
                var cs = Number(detail.cs).toFixed(2)
                var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                const embed = new Discord.RichEmbed()
                .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor('#7f7fff')
                .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[0].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function beatmapdetail() {
            try {
                var beatmapid = []
                var start = 0
                var mods = []
                for (var m = 0; m < msg.length; m++) {
                    if (msg.substr(m,21) == 'https://osu.ppy.sh/b/') {
                        start = m + 21
                        for (var i = start; i <= msg.length; i++) {
                            if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                                if (msg.substring(start, msg.length).includes('?m=') == true) {
                                    beatmapid.push(msg.substring(start,i-4))
                                    start = i
                                    break;
                                } else {
                                    beatmapid.push(msg.substring(start,i))
                                    start = i
                                    break;
                                }
                            }
                        }
                        if (msg.substr(start+1,1) == "+") {
                            for (var i = start+2; i <= msg.length; i++) {
                                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                                    mods.push(msg.substring(start+2,i))
                                    start = i + 1
                                    break;
                                }
                            }
                        } else {
                            mods.push('No Mod')
                        }

                    }
                    if (msg.substr(m,31) == 'https://osu.ppy.sh/beatmapsets/') {
                        start = m + 31
                        start = msg.indexOf('#', start) + 1
                        start = msg.indexOf('/', start) + 1
                        for (var i = start; i <= msg.length; i++) {
                            if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                                beatmapid.push(msg.substring(start,i))
                                start = i
                                break;
                            }
                        }
                        if (msg.substr(start+1,1) == "+") {
                            for (var i = start+2; i <= msg.length; i++) {
                                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                                    mods.push(msg.substring(start+2,i))
                                    start = i + 1
                                    break;
                                }
                            }
                        } else {
                            mods.push('No Mod')
                        }
                    }
                }
                for (i = 0; i < beatmapid.length; i++) {
                    var bitpresent = 0
                    var mod = {
                        nf: 1,
                        ez: 2,
                        td: 4,
                        hd: 8,
                        hr: 16,
                        dt: 64,
                        rx: 128,
                        ht: 256,
                        nc: 512,
                        fl: 1024,
                        so: 4096
                    }
                    var validmod = false
                    for (var m = 0; m <= mods[i].length; m++) {
                        if (mod[mods[i].substr(m*2,2)]) {
                            bitpresent += mod[mods[i].substr(m*2,2)]
                            validmod = true
                        }
                    }
                    if (validmod == false) {
                        mods[0] = 'No Mod'
                    }
                    var map = await osuApi.getBeatmaps({b: beatmapid[i]})
                    if (map.length == 0) {
                        throw 'Is this even a valid link?'
                    }
                    var beatmapidfixed = map[0].beatmapSetId
                    var title = map[0].title
                    var mapper = map[0].creator
                    var version = map[0].version
                    var maxCombo = map[0].maxCombo
                    var parser = await precalc(beatmapid[i])
                    var acc95 = ppcalc(parser,bitpresent,maxCombo,0,0,0,95,0)
                    var acc97 = ppcalc(parser,bitpresent,maxCombo,0,0,0,97,0)
                    var acc99 = ppcalc(parser,bitpresent,maxCombo,0,0,0,99,0)
                    var acc100 = ppcalc(parser,bitpresent,maxCombo,0,0,0,100,0)
                    var detail = mapdetail(mods[i],map[0].time.total,map[0].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                    var totallength = Number(detail.length).toFixed(0)
                    var bpm = Number(detail.bpm).toFixed(0)
                    var ar = Number(detail.ar).toFixed(2)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    var cs = Number(detail.cs).toFixed(2)
                    var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor('#7f7fff')
                    .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[i].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function calculateplay() {
            try {
                var start = 8
                var beatmapid = 0
                var mods = []
                var acc = 0
                var combo = 0
                var miss = 0
                var bitpresent = 0
                for (var i = start; i < msg.length; i++) {
                    if (msg.substr(i,1) == ' ') {
                        beatmapid = msg.substring(start,i)
                        start = i + 1
                        break
                    }
                }
                for (var i = start; i < msg.length; i++) {
                    if (msg.substr(i,1) == ' ') {
                        mods.push(msg.substring(start,i))
                        start = i + 1
                        break
                    }
                }
                for (var i = start; i < msg.length; i++) {
                    if (msg.substr(i,1) == ' ') {
                        acc = Number(msg.substring(start,i))
                        start = i + 1
                        break
                    }
                }
                for (var i = start; i < msg.length; i++) {
                    if (msg.substr(i,1) == ' ') {
                        combo = Number(msg.substring(start,i))
                        start = i + 1
                        break
                    }
                }
                for (var i = start; i <= msg.length; i++) {
                    if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                        miss = Number(msg.substring(start,i))
                        break
                    }
                }
                var mod = {
                    nomod: 0,
                    nf: 1,
                    ez: 2,
                    td: 4,
                    hd: 8,
                    hr: 16,
                    dt: 64,
                    rx: 128,
                    ht: 256,
                    nc: 512,
                    fl: 1024,
                    so: 4096
                }
                for (var m = 0; m <= mods[0].length; m++) {
                    if (mod[mods[0].substr(m*2,2)]) {
                        bitpresent += mod[mods[0].substr(m*2,2)]
                    }
                }
                var map = await osuApi.getBeatmaps({b: beatmapid})
                if (map.length == 0) {
                    throw 'Please check the ID of the map is correct or not'
                }
                var parser = await precalc(beatmapid)
                var calc = ppcalc(parser,bitpresent,combo,0,0,miss,acc,0)
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                const embed = new Discord.RichEmbed()
                    .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor('#7f7fff')
                    .setDescription(`
Difficulty: *${version}*
With **${mods[0].toUpperCase()}**, **${acc}%** accuracy, **${combo}x** combo and **${miss}** miss:
-- **${Number(calc.pp.total).toFixed(2)}pp**`)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osuscore() {
            try {
                urlcommand = true
                var beatmapid = 0
                var check = ''
                var start = 0
                if (msg.substr(8,21) == 'https://osu.ppy.sh/b/') {
                    start = 8 + 21
                    for (var i = start; i <= msg.length; i++) {
                        if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                            if (msg.substring(start, msg.length).includes('?m=') == true) {
                                beatmapid = msg.substring(start,i-4)
                                start = i
                                break;
                            } else {
                                beatmapid = msg.substring(start,i)
                                start = i
                                break;
                            }
                        }
                    }
                    check = msg.substring(start + 1, msg.length)
                }
                if (msg.substr(8,31) == 'https://osu.ppy.sh/beatmapsets/') {
                    start = 8 + 31
                    start = msg.indexOf('#', start) + 1
                    start = msg.indexOf('/', start) + 1
                    for (var i = start; i <= msg.length; i++) {
                        if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                            beatmapid = msg.substring(start,i)
                            start = i
                            break;
                        }
                    }
                    check = msg.substring(start + 1, msg.length)
                }
                var name = checkplayer(check)
                var scores = await osuApi.getScores({b: beatmapid, u: name})
                scores.sort(function (a,b) {
                    a1 = Number(a.pp)
                    b1 = Number(b.pp)
                    return b1 - a1
                })
                if (scores.length == 0) {
                    throw `${name} didn't play this map! D: **-Tiny**`
                }
                var beatmap = await osuApi.getBeatmaps({b: beatmapid})
                var highscore = ''
                var beatmapname = beatmap[0].title
                var diff = beatmap[0].version
                var beatmapimageid = beatmap[0].beatmapSetId
                var osuname = scores[0].user.name
                var osuid = scores[0].user.id
                var parser = await precalc(beatmapid)
                for (var i = 0; i < scores.length; i++) {
                    var score = scores[i].score
                    var count300 = Number(scores[i].counts['300'])
                    var count100 = Number(scores[i].counts['100'])
                    var count50 = Number(scores[i].counts['50'])
                    var countmiss = Number(scores[i].counts.miss)
                    var combo = scores[i].maxCombo
                    var fc = beatmap[0].maxCombo
                    var letter = scores[i].rank
                    var rank = rankingletters(letter)
                    var mod = scores[i].mods
                    var perfect = scores[i].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(scores[i].date)
                    var pp = Number(scores[i].pp).toFixed(2)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var unrankedpp = ''
                    if (beatmap[0].approvalStatus !== "Ranked" && beatmap[0].approvalStatus !== "Approved") {
                        var comparepp = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                        unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                        highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${pp}pp*** ${unrankedpp}
${rank} **Score:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`         
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}]`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
                urlcommand = false
            } catch (error) {
                urlcommand = false
                message.channel.send(String(error))
            }
        }

        function acccalc() {
            var count300 = 0
            var count100 = 0
            var count50 = 0
            var countmiss = 0
            var start = 5
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    count300 = Number(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    count100 = Number(msg.substring(start, i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    count50 = Number(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                    countmiss = Number(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
            message.channel.send(`**Accuracy:** ${acc}%`)

        }

        async function tourneydetail() {
            try {
                var error, respone, html = await request(message.embeds[0].url)
                const information = {
                    tourneyname: '',
                    tourneytype: '',
                    range: '',
                    prize: {},
                    score: '',
                    customrange: {}
                }
                var start = 0
                var clean = san(html, {allowedTags: []})
                if (clean.substring(17500).includes('tournament') == true) {
                    var name = message.embeds[0].title.indexOf('forums')
                    information.tourneyname = message.embeds[0].title.substring(0, name - 3)
                    var range = clean.toLowerCase().indexOf('range')
                    if (range == -1) {
                        range = clean.toLowerCase().indexOf('rank')
                    }
                    if (range == -1) {
                        information.range = "Can't get range data"
                    } 
                    if (range !== -1) {
                        for (var i = range; i < clean.length; i++) {
                            if (String(Number(clean.substr(i,1))) !== "NaN" && clean.substr(i,1) !== " ") {
                                start = i
                                break
                            }
                        }
                        for (var i = start; i < clean.length; i++) {
                            if (String(Number(clean.substr(i,1))) !== "NaN" && clean.substr(i,1) !== " ") {
                                start = i
                                break
                            }
                        }
                        for (var i = start; i < clean.length; i++) {
                            if (String(Number(clean.substr(i+1,1))) == "NaN" && clean.substr(i+1,1) !== "k" && clean.substr(i+1,1) !== "~"  && clean.substr(i+1,1) !== " "  && clean.substr(i+1,1) !== "-"  && clean.substr(i+1,1) !== "."  && clean.substr(i+1,1) !== ",") {
                                information.range = clean.substring(start,i)
                                break
                            }
                            if (clean.substr(i-1,2) == "k.") {
                                information.range = clean.substring(start,i)
                                break
                            }
                        }
                    }
                    var prize = clean.toLowerCase().indexOf('supporter')
                    var check = '1st'
                    if (prize !== -1) {
                        for (var p = 0; p < 5; p++) {
                            for (var i = prize; i > prize - 100; i--) {
                                if (clean.substring(i-3, i) == check) {
                                    information.prize[check] = clean.substring(prize+9,i+1)
                                    var plus = clean.toLowerCase().indexOf('badge', prize)
                                    if (plus > prize && plus < prize + 50) {
                                        information.prize[check] += ' + badge'
                                    }
                                    if (information.prize[check].toLowerCase().includes('place') == true) {
                                        var pos = information.prize[check].toLowerCase().indexOf('place')
                                        information.prize[check] =  information.prize[check].substring(pos+7)
                                    }
                                    prize = clean.toLowerCase().indexOf('supporter', prize + 10)
                                    break
                                }
                            }
                            if (p == 0) {
                                check = '2nd'
                            }
                            if (p == 1) {
                                check = '3rd'
                            }
                            if (p == 2) {
                                check = '4th'
                            }
                            if (p == 3) {
                                check = '5th'
                            }
                        }
                    }
                    for (var i = 1; i < 9; i++) {
                        if (clean.toLowerCase().includes(`${i}v${i}`) == true) {
                            information.tourneytype = `${i}v${i}`
                            break
                        }
                    }
                    if (clean.toLowerCase().includes('scorev2') == true || clean.toLowerCase().includes('score v2') == true) {
                        information.score = 'ScoreV2'
                    }
                    if (clean.toLowerCase().includes('scorev1') == true || clean.toLowerCase().includes('score v1') == true) {
                        information.score = 'ScoreV1'
                    }
                    // Init
                    if (information.score == ' ' || information.score == '' ) {
                        information.score = 'ScoreV2?'
                    }
                    var prizetext = ''
                    var prefix = '1st'
                    if (information.prize[prefix] !== undefined) {
                        for (var i = 0; i < 5; i++) {
                            if (information.prize[prefix] !== undefined) {
                                prizetext += `${prefix}: ${information.prize[prefix]}
                                `
                            }
                            if (i == 0) {
                                prefix = '2nd'
                            }
                            if (i == 1) {
                                prefix = '3rd'
                            }
                            if (i == 2) {
                                prefix = '4th'
                            }
                            if (i == 3) {
                                prefix = '5th'
                            }
                        }   
                    }
                    if (prizetext == '') {
                        prizetext = "Can't get prize data"
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(information.tourneyname)
                    .setDescription(`
**--- [tl;dr]**

**Range:** ${information.range}
**Type:** ${information.tourneytype}
**Score:** ${information.score}
**Prize:** 
${prizetext}`)
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Osu%21Logo_%282015%29.svg/600px-Osu%21Logo_%282015%29.svg.png')
                    message.channel.send({embed})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutrack() {
            var osuname = message.content.substring(10)
            var detected = false
            var user = await osuApi.getUser({u: osuname})
            var name = user.name
            var best = await osuApi.getUserBest({u: osuname, limit: 50})
            if (name == undefined) {
                message.channel.send('Please enter a valid osu username! >:c')
            } else {
                for (var i = 0; i < track.length; i++) {
                    if (track[i].osuname == name) {
                        detected = true
                        if (track[i].trackonchannel.includes(message.channel.id) == true) {
                            track[i].osuname = name
                            track[i].top50pp = best[49][0].pp
                            track[i].lasttotalpp = user.pp.raw
                            track[i].lastrank = user.pp.rank
                            track[i].lastcountryrank = user.pp.countryRank
                            break
                        } else {
                            track[i].osuname = name
                            track[i].top50pp = best[49][0].pp
                            track[i].lasttotalpp = user.pp.raw
                            track[i].lastrank = user.pp.rank
                            track[i].lastcountryrank = user.pp.countryRank
                            track[i].trackonchannel.push(message.channel.id)
                            break
                        }
                    }
                }
                if (detected == false) {
                    track.push({"osuname":name,"top50pp":best[49][0].pp,"lasttotalpp":user.pp.raw,"lastrank":user.pp.rank,"lastcountryrank":user.pp.countryRank,"trackonchannel": [message.channel.id],"recenttimeplay": ""})
                }
                message.channel.send(`**${name}** is now being tracked on **#${message.channel.name}**`)
                fs.writeFileSync('track.txt', JSON.stringify(track))
                bot.channels.get('497302830558871552').send({files: [{
                    attachment: './track.txt',
                    name: 'track.txt'
                }]})
            }
        }

        async function untrack() {
            for (var i = 0; i < track.length; i++) {
                if (track[i].osuname == message.content.substring(9)) {
                    if (track[i].trackonchannel.includes(message.channel.id) == true && track[i].trackonchannel.length > 1) {
                        track[i].trackonchannel.splice(track[i].trackonchannel.indexOf(message.channel.id), 1)
                        message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                        fs.writeFileSync('track.txt', JSON.stringify(track))
                        bot.channels.get('497302830558871552').send({files: [{
                            attachment: './track.txt',
                            name: 'track.txt'
                        }]})
                        break
                    } else {
                        track.splice(i,1)
                        message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                        fs.writeFileSync('track.txt', JSON.stringify(track))
                        bot.channels.get('497302830558871552').send({files: [{
                            attachment: './track.txt',
                            name: 'track.txt'
                        }]})
                        break
                    }
                    
                }
            }
        }

        async function recommendation() {
            try {
                if (cache[message.author.id] == undefined) {
                    throw "You didn't link your profile to osu"
                }
                var name = cache[message.author.id].osuname
                var best = await osuApi.getUserBest({u: name, limit: 25})
                var otherbest = ''
                var minPP = 0
                var averageAcc = 0
                var averageCombo = 0
                var averageMiss = 0
                for (var i = 0; i < best.length; i ++) {
                    minPP += Number(best[i][0].pp)
                    var count300 = Number(best[0][0].counts['300'])
                    var count100 = Number(best[0][0].counts['100'])
                    var count50 = Number(best[0][0].counts['50'])
                    var countmiss = Number(best[0][0].counts.miss)
                    averageAcc += Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                    averageCombo += Number(best[i][1].maxCombo)
                    averageMiss += countmiss
                }
                minPP = minPP / best.length * 0.9
                var maxPP = minPP * 1.25
                averageAcc = averageAcc / best.length
                if (averageAcc > 100) {averageAcc = 100}
                averageCombo = Number((averageCombo / best.length * 1.9).toFixed(0))
                averageMiss = Number((averageMiss / best.length).toFixed(0))
                var pos = Math.floor(Math.random() * 24)
                var pickedTopPlay = best[pos][1].id
                var mod = mods(best[pos][0].mods).bitpresent
                var pick = Math.floor(Math.random() * 24.99)
                var topplayfrom = ''
                if (pick == 0) {
                    // Get own top play
                    averageAcc *= 1.02
                    for (var i = 0; i < 10; i++) {
                        var parser = await precalc(pickedTopPlay)
                        var recommend = ppcalc(parser, mod, best[pos][1].maxCombo, 0, 0, 0, averageAcc, 0)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && recommend.pp.total > best[pos][0].pp) {
                            topplayfrom = 'own'
                            break
                        } else {
                            pos = Math.floor(Math.random() * 24)
                            pickedTopPlay = best[pos][1].id
                            mod = mods(best[pos][0].mods).bitpresent
                        }
                    }
                } else if (pick > 0) {
                    averageAcc *= 0.99
                    // Get other top play
                    var beatmapTopPlay = await osuApi.getScores({b: pickedTopPlay, m: mod, limit: 100})
                    beatmapTopPlay.sort(function(a,b) {return Math.abs(minPP - a) - Math.abs(minPP - b)})
                    beatmapTopPlay.splice(24,75)
                    var getRandomPlayer = beatmapTopPlay[Math.floor(Math.random() * 24)].user.id
                    otherbest = await osuApi.getUserBest({u: getRandomPlayer, limit: 100})
                    otherbest.sort(function(a,b) {return Math.abs(minPP - a) - Math.abs(minPP - b)})
                    otherbest.splice(24,75)
                    pickedTopPlay = otherbest[pos][1].id
                    mod = mods(otherbest[pos][0].mods).bitpresent
                    for (var i = 0; i < 10; i++) {
                        // Mod Play
                        var parser = await precalc(pickedTopPlay)
                        var recommend = ppcalc(parser, mod, otherbest[pos][1].maxCombo, 0, 0, 0, averageAcc, averageMiss)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && otherbest[pos][1].maxCombo < averageCombo) {
                            topplayfrom = 'other'
                            break
                        }
                        // No mod play
                        mod = 0
                        recommend = ppcalc(parser, mod, otherbest[pos][1].maxCombo, 0, 0, 0, averageAcc, averageMiss)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && otherbest[pos][1].maxCombo < averageCombo) {
                            topplayfrom = 'other'
                            break
                        } else {
                            pos = Math.floor(Math.random() * 24)
                            pickedTopPlay = otherbest[pos][1].id
                            mod = mods(otherbest[pos][0].mods).bitpresent
                            
                        }
                    }
                }
            
                // Gather data
            
                var maprecommendeded = ''
                var misses = 0
                if (topplayfrom == 'own') {
                    maprecommendeded = best[pos]
                } else if (topplayfrom == 'other') {
                    maprecommendeded = otherbest[pos]
                    misses = averageMiss
                } else {
                    throw 'No recommended map was found'
                }
                var beatmapidfixed = maprecommendeded[1].beatmapSetId
                var title = maprecommendeded[1].title
                var mapper = maprecommendeded[1].creator
                var version = maprecommendeded[1].version
                var maxCombo = maprecommendeded[1].maxCombo
                var shortenmod = bittomods(mod)
                var parser = await precalc(pickedTopPlay)
                var acc95 = ppcalc(parser,mod,maxCombo,0,0,0,95,0)
                var acc97 = ppcalc(parser,mod,maxCombo,0,0,0,97,0)
                var acc99 = ppcalc(parser,mod,maxCombo,0,0,0,99,0)
                var acc100 = ppcalc(parser,mod,maxCombo,0,0,0,100,0)
                var pppredicttoget = ppcalc(parser,mod,maxCombo,0,0,0,averageAcc,misses)
                var detail = mapdetail(shortenmod,maprecommendeded[1].time.total,maprecommendeded[1].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                var totallength = Number(detail.length).toFixed(0)
                var bpm = Number(detail.bpm).toFixed(0)
                var ar = Number(detail.ar).toFixed(2)
                var od = Number(detail.od).toFixed(2)
                var hp = Number(detail.hp).toFixed(2)
                var cs = Number(detail.cs).toFixed(2)
                var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                const embed = new Discord.RichEmbed()
                .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${pickedTopPlay}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor('#7f7fff')
                .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${shortenmod}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp
**Predicted PP you'll get: ${Number(pppredicttoget.pp.total).toFixed(2)}pp**`)
                message.channel.send('Found 1 map')
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        // Other server (Akatsuki, Ripple) Function

        async function otherserveravatar(start, serverlink) {
            var data = await request.get(`https://${serverlink}/api/v1/users?name=${message.content.substring(start)}`)
            var user = JSON.parse(data)
            var username = user.username
            var id = user.id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setImage(`https://a.${serverlink}/${id}.png?date=${refresh}.png`)
            message.channel.send({embed})
        }

        async function otherserverosu(start, serverlink) {
            try {
                var d = msg.includes('-d')
                var check = ''
                if (msg.indexOf('-d') !== start && d !== false) {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            check = msg.substring(start, i)
                            break
                        }
                    }
                } else if (msg.indexOf('-d') == start) {
                    check = ''
                } else {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            check = msg.substring(start, i+1)
                            break
                        }
                    }
                }
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    servername = 'Akatsuki'
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                if (d == true) {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=50`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/full?name=${check}&mode=0`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    if (best.length == 0) {
                        throw 'Either invalid user or not enough top play to calcuate'
                    }
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var acc_avg = 0
                    var cs_avg = 0
                    var ar_avg = 0
                    var od_avg = 0
                    var hp_avg = 0
                    var userid = user.id
                    var username = user.username
                    var rank = user.std.global_leaderboard_rank
                    var country = user.country.toLowerCase()
                    var countryrank = null
                    var level = user.std.level
                    var pp = user.std.pp
                    var acc = Number(user.std.accuracy).toFixed(2)
                    var playcount = user.std.playcount
                    var rankedscore = user.std.ranked_score
                    var totalscore = user.std.total_score

                    for (var i = 0; i < 50; i++) {
                        var beatmapid = best.scores[i].beatmap.beatmap_id
                        var mod = best.scores[i].mods
                        var shortenmod = bittomods(mod)
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = ppcalc(parser,mod,0,0,0,0,0,0)
                        var detail = mapdetail(shortenmod,0,0,thing.cs,thing.ar,thing.od,thing.hp)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                        speed_avg += thing.star.speed
                        acc_avg += (Math.pow(scoreacc, 3)/Math.pow(100, 3)) * 1.1 * thing.star.total * (Math.pow(detail.od, 0.05) / (Math.pow(6, 0.05)))
                        cs_avg += detail.cs
                        ar_avg += detail.ar
                        od_avg += detail.od
                        hp_avg += detail.hp
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${servername} Statistics for ${username}`)
                    .setThumbnail(`https://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(`***Performance:***
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank}) | ***${pp}pp***
**Level:** ${level}
**Accuracy:** ${acc}%
**Playcount:** ${playcount}
**Ranked Score:** ${rankedscore} | **Total Score:** ${totalscore}

***${username} average skill:***
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2) *2}★
Speed skill: ${Number(speed_avg/50).toFixed(2) *2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}`)
                    message.channel.send({embed});
                } else {
                    var data = await request.get(`https://${serverlink}/api/v1/users/full?name=${check}`)
                    var user = JSON.parse(data)
                    var username = user.username
                    var id = user.id
                    var acc = Number(user.std.accuracy).toFixed(2)
                    var level = Number(user.std.level).toFixed(2)
                    var played = user.std.playcount
                    var pp = user.std.pp
                    var rank = user.std.global_leaderboard_rank
                    var countryrank = user.std.country_leaderboard_rank
                    var country = String(user.country).toLowerCase()
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${servername} status for: ${username}`,'',`https://${serverlink}/u/${id}`)
                    .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
`)
                .setThumbnail(`https://a.${serverlink}/${id}.png?date=${refresh}`)
                .setColor('#7f7fff')
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherserverrecent(start,serverlink) {
            try {
                var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/recent?name=${message.content.substring(start)}`)
                var data2 = await request.get(`https://${serverlink}/api/v1/users?name=${message.content.substring(start)}`)
                var recent = JSON.parse(data1)
                var user = JSON.parse(data2)
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    servername = 'Akatsuki'
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                var userid = user.id
                var username = user.username
                var beatmapid = recent.scores[0].beatmap.beatmap_id
                var beatmapsetid = recent.scores[0].beatmap.beatmapset_id
                var beatmap = recent.scores[0].beatmap.song_name
                var score = recent.scores[0].score
                var combo = recent.scores[0].max_combo
                var fc = recent.scores[0].beatmap.max_combo
                var count300 = Number(recent.scores[0].count_300)
                var count100 = Number(recent.scores[0].count_100)
                var count50 = Number(recent.scores[0].count_50)
                var countmiss = Number(recent.scores[0].count_miss)
                var perfect = recent.scores[0].full_combo
                var letter = recent.scores[0].rank
                var rank = rankingletters(letter)
                var bit = recent.scores[0].mods
                var mods = bittomods(bit)   
                var acc = Number(recent.scores[0].accuracy).toFixed(2)
                var parser = await precalc(beatmapid)
                var recentcalc = ppcalc(parser,bit,combo,count100,count50,countmiss,acc,0)
                var star = Number(recentcalc.star.total).toFixed(2)
                var pp = Number(recentcalc.pp.total).toFixed(2)
                if (message.guild !== null) {
                    storedmapid.push({id:beatmapid,server:message.guild.id})
                } else {
                    storedmapid.push({id:beatmapid,user:message.author.id})
                }
                var fccalc = ppcalc(parser,bit,fc,count100,count50,0,acc,1)
                var fcpp = Number(fccalc.pp.total).toFixed(2)
                var fcacc = fccalc.acc
                var fcguess = ``
                var nopp = ''
                if (letter == 'F') {
                    nopp = '(No pp)'
                }
                if (perfect == 0) {
                    fcguess = `| **${fcpp}pp for ${fcacc}%**`
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Most recent ripple play for ${username}:`, `https://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapsetid}l.jpg`)
                .setColor('#7f7fff')
                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${mods} | ***${pp}pp*** ${nopp}
${rank} **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}`)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherservertop(start, serverlink) {
            try {
                var p = msg.includes('-p')
                var check = ''
                var top = ''
                if (msg.indexOf('-p') !== start && p !== false) {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            check = msg.substring(start, i)
                            break
                        }
                    }
                } else if (msg.indexOf('-p') == start) {
                    check = ''
                } else {
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            check = msg.substring(start, i+1)
                            break
                        }
                    }
                }
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    servername = 'Akatsuki'
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                if (p == true) {
                    var n = 0
                    for (var i = msg.indexOf('-p') + 3; i < msg.length; i++) {
                        if (msg.substr(i+1,1) == '') {
                            n = Number(msg.substring(msg.indexOf('-p') + 3, i+1)) -1
                            break
                        }
                    }
                    var data = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=${n}`)
                    var best = JSON.parse(data)
                    var userid = best.scores[0].id
                    var title = best.scores[n].beatmap.song_name
                    var beatmapid = best.scores[n].beatmap.beatmap_id
                    var score = best.scores[n].score
                    var count300 = Number(best.scores[n].count_300)
                    var count100 = Number(best.scores[n].count_100)
                    var count50 = Number(best.scores[n].count_50)
                    var countmiss = Number(best.scores[n].count_miss)
                    var combo = best.scores[n].max_combo
                    var fc = best.scores[n].beatmap.max_combo
                    var letter = best.scores[n].rank
                    var rank = rankingletters(letter)
                    var pp = Number(best.scores[n].pp).toFixed(2)
                    var mod = best.scores[n].mods
                    var shortenmod = bittomods(mod)
                    var date = timeago(best.scores[n].time)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var parser = await precalc(beatmapid)
                    var starcalc = ppcalc(parser,beatmapid,mod,0,0,0,0,0,0)
                    var star = Number(starcalc.star.total).toFixed(2)
                    var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                    top += `
${n+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail}
${date}
`
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top ${servername} Plays for ${check}`)
                .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setColor('#7f7fff')
                .setDescription(top)
                message.channel.send({embed});
                } else {
                    var data = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=5`)
                    var best = JSON.parse(data)
                    var userid = best.scores[0].id
                    for (var i = 0; i < 5; i++) {
                        var title = best.scores[i].beatmap.song_name
                        var beatmapid = best.scores[i].beatmap.beatmap_id
                        var score = best.scores[i].score
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var combo = best.scores[i].max_combo
                        var fc = best.scores[i].beatmap.max_combo
                        var letter = best.scores[i].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best.scores[i].pp).toFixed(2)
                        var mod = best.scores[i].mods
                        var shortenmod = bittomods(mod)
                        var date = timeago(best.scores[i].time)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var starcalc = ppcalc(parser,beatmapid,mod,0,0,0,0,0,0)
                        var star = Number(starcalc.star.total).toFixed(2)
                        var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                        top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail}
${date}
`                   }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top Akatsuki Relax Plays for ${check}`)
                    .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor('#7f7fff')
                    .setDescription(top)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        // Osu

        if (msg.substring(0,4) == '!osu' && msg.substring(0,4) == command) {
            osu(5,0)
        }
        if (msg.substring(0,6) == '!taiko' && msg.substring(0,6) == command) {
            osu(7,1)
        }
        if (msg.substring(0,4) == '!ctb' && msg.substring(0,4) == command) {
            osu(5,2)
        }
        if (msg.substring(0,6) == '!mania' && msg.substring(0,6) == command) {
            osu(7,3)
        }
        if (msg.substring(0,7) == '!osusig' && msg.substring(0,7) == command) {
            osusig()
        }
        if (msg.substring(0,10) == '!osuavatar' && msg.substring(0,10) == command) {
            osuavatar()
        }
        if (msg.substring(0,7) == '!osuset' && msg.substring(0,7) == command) {
            osuset()
        }
        if (msg.substring(0,7) == '!recent' && msg.substring(0,7) == command) {
            recent(8)
        }
        if (msg.substring(0,2) == '!r' && msg.substring(0,2) == command) {
            recent(3)
        }
        if (msg.substring(0,7) == '!compare' && msg.substring(0,7) == command) {
            compare(8)
        }
        if (msg.substring(0,2) == '!c' && msg.substring(0,2) == command) {
            compare(3)
        }
        if (msg.substring(0,7) == '!osutop' && msg.substring(0,7) == command) {
            osutop(0,8)
        }
        if (msg.substring(0,9) == '!taikotop' && msg.substring(0,9) == command) {
            osutop(1,10)
        }
        if (msg.substring(0,7) == '!ctbtop' && msg.substring(0,7) == command) {
            osutop(2,8)
        }
        if (msg.substring(0,9) == '!maniatop' && msg.substring(0,9) == command) {
            osutop(3,10)
        }
        if (msg.substring(0,4) == '!map' && msg.substring(0,4) == command) {
            map()
        }
        if (msg.substring(0,2) == '!m' && msg.substring(0,2) == command) {
            map()
        }
        if (msg.substring(0,7) == '!calcpp' && msg.substring(0,7) == command) {
            calculateplay()
        }
        if (msg.substring(0,7) == '!scores' && msg.substring(0,7) == command) {
            osuscore()
        }
        if (msg.substring(0,4) == '!acc' && msg.substring(0,4) == command) {
            acccalc()
        }
        if (msg.substring(0,9) == '!osutrack' && msg.substring(0,9) == command && message.channel.name !== undefined) {
            osutrack()            
        }
        if (msg.substring(0,8) == '!untrack' && msg.substring(0,8) == command && message.channel.name !== undefined) {
            untrack()
        }
        if (msg.substring(0,84) == '!rec' && msg.substring(0,4) == command) {
            recommendation()
        }

        // Akatuski

        if (msg.substring(0,11) == '!akatavatar' && msg.substring(0,11) == command) {
            otherserveravatar(12,'akatsuki.pw')
        }
        if (msg.substring(0,9) == '!akatsuki' && msg.substring(0,9) == command) {
            otherserverosu(10,'akatsuki.pw')
        }
        if (msg.substring(0,6) == '!akatr' && msg.substring(0,6) == command) {
            otherserverrecent(7,'akatsuki.pw')
        }
        if (msg.substring(0,8) == '!akattop' && msg.substring(0,8) == command) {
            otherservertop(9,'akatsuki.pw')
        }

        // Ripple

        if (msg.substring(0,13) == '!rippleavatar' && msg.substring(0,13) == command) {
            otherserveravatar(14,'ripple.moe')
        }
        if (msg.substring(0,7) == '!ripple' && msg.substring(0,7) == command) {
            otherserverosu(8,'ripple.moe')
        }
        if (msg.substring(0,8) == '!rippler' && msg.substring(0,8) == command) {
            otherserverrecent(9,'ripple.moe')
        }
        if (msg.substring(0,10) == '!rippletop' && msg.substring(0,10) == command) {
            otherservertop(11,'ripple.moe')
        }

        // Detection
        var embed = message.embeds
        // Beatmap Detection
        if (urlcommand == false) {
            beatmapdetail()
        }
        // Tourney Detection
        if (embed.length > 0) {
            if (message.embeds[0].url.substring(0,43) == "https://osu.ppy.sh/community/forums/topics/" || message.embeds[0].url.substring(0,42) == "http://osu.ppy.sh/community/forums/topics/")
            tourneydetail()
        }
    }
})

bot.login(process.env.BOT_TOKEN);
