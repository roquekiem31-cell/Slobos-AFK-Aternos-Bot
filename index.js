const mineflayer = require('mineflayer')
const fs = require('fs');
const { keep_alive } = require("./keep_alive");

keep_alive();

process.on('uncaughtException', function(err) {
  console.log("Uncaught exception (process kept alive):", err.message);
});

let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = ['forward', 'back', 'left', 'right'];
var lastaction;
var pi = 3.14159;
var moveinterval = 3;
var maxrandom = 7;
var host = data["ip"];
var username = data["name"];

var chatMessages = [
  'lol',
  'ok',
  'brb',
  'hi',
  'yeah',
  'nice',
  'gg',
  'sure',
  'hmm',
  ':)',
  'wb',
  'hey',
  'cool',
  'afk for a bit'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createBot() {
  var bot = mineflayer.createBot({
    host: host,
    username: username,
    checkTimeoutInterval: 60000
  });

  bot.on('login', function() {
    console.log("Logged In");
  });

  bot.on('spawn', function() {
    connected = 1;
    console.log("Bot spawned and connected");

    // Send a random chat message every 3-8 minutes
    setInterval(function() {
      if (connected < 1) return;
      var msg = chatMessages[Math.floor(Math.random() * chatMessages.length)];
      try {
        bot.chat(msg);
        console.log("Chat sent:", msg);
      } catch(e) {}
    }, randomInt(3 * 60 * 1000, 8 * 60 * 1000));

    // Randomly jump every 1-4 minutes
    setInterval(function() {
      if (connected < 1) return;
      try {
        bot.setControlState('jump', true);
        setTimeout(function() {
          try { bot.setControlState('jump', false); } catch(e) {}
        }, 500);
      } catch(e) {}
    }, randomInt(1 * 60 * 1000, 4 * 60 * 1000));

    // Randomly sneak every 2-5 minutes
    setInterval(function() {
      if (connected < 1) return;
      try {
        bot.setControlState('sneak', true);
        setTimeout(function() {
          try { bot.setControlState('sneak', false); } catch(e) {}
        }, randomInt(1000, 3000));
      } catch(e) {}
    }, randomInt(2 * 60 * 1000, 5 * 60 * 1000));
  });

  bot.on('time', function() {
    if (connected < 1) return;
    if (lasttime < 0) {
      lasttime = bot.time.age;
    } else {
      var randomadd = Math.random() * maxrandom * 20;
      var interval = moveinterval * 20 + randomadd;
      if (bot.time.age - lasttime > interval) {
        if (moving == 1) {
          bot.setControlState(lastaction, false);
          moving = 0;
          lasttime = bot.time.age;
        } else {
          var yaw = Math.random() * pi * 2 - pi;
          var pitch = Math.random() * (pi / 2) - (pi / 4);
          try {
            bot.look(yaw, pitch, false);
            lastaction = actions[Math.floor(Math.random() * actions.length)];
            bot.setControlState(lastaction, true);
            moving = 1;
            lasttime = bot.time.age;
            if (Math.random() > 0.7) bot.activateItem();
          } catch(e) {}
        }
      }
    }
  });

  bot.on('kicked', function(reason) {
    console.log("Bot was kicked:", reason);
    connected = 0;
    lasttime = -1;
  });

  bot.on('error', function(err) {
    console.log("Bot error:", err.message);
    connected = 0;
    lasttime = -1;
  });

  bot.on('end', function() {
    console.log("Bot disconnected, reconnecting in 60 seconds...");
    connected = 0;
    lasttime = -1;
    setTimeout(createBot, 60000);
  });
}

createBot();
