const mineflayer = require('mineflayer')
const fs = require('fs');
const { keep_alive } = require("./keep_alive");

keep_alive();

process.on('uncaughtException', function(err) {
  console.log("Uncaught exception (process kept alive):", err.message);
});

let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var connected = 0;
var lasttime = -1;
var moving = 0;
var lastaction;
var pi = 3.14159;
var host = data["ip"];
var username = data["name"];

var chatReplies = [
  'lol', 'ok', 'yeah', 'sure', 'nice', 'gg', 'hi', 'hey',
  'brb', 'wb', 'cool', 'ok ok', 'true', 'lmao', 'fr',
  'nah', 'yep', 'haha', 'omg', 'ikr'
];

var randomChats = [
  'Sara is A meanie and Kiem is an Awesome Person'
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  bot.on('spawn', async function() {
    connected = 1;
    console.log("Bot spawned and connected");

    // Auto-login for servers with auth plugins
    setTimeout(function() {
      try {
        bot.chat('/login chalol78');
        console.log("Sent login command");
      } catch(e) {}
    }, 1500);

    // Reply to chat messages
    bot.on('chat', function(user, message) {
      if (user === username) return;
      if (Math.random() < 0.4) {
        setTimeout(function() {
          if (connected < 1) return;
          var reply = chatReplies[Math.floor(Math.random() * chatReplies.length)];
          try { bot.chat(reply); } catch(e) {}
        }, rand(2000, 6000));
      }
    });

    // Send random chat every 4-10 minutes
    setInterval(function() {
      if (connected < 1) return;
      var msg = randomChats[Math.floor(Math.random() * randomChats.length)];
      try { bot.chat(msg); } catch(e) {}
    }, rand(4 * 60 * 1000, 10 * 60 * 1000));

    // Jump randomly every 1-5 minutes
    setInterval(function() {
      if (connected < 1) return;
      try {
        bot.setControlState('jump', true);
        setTimeout(() => { try { bot.setControlState('jump', false); } catch(e) {} }, 300);
      } catch(e) {}
    }, rand(60 * 1000, 5 * 60 * 1000));

    // Sneak randomly every 2-6 minutes
    setInterval(function() {
      if (connected < 1) return;
      try {
        bot.setControlState('sneak', true);
        setTimeout(() => { try { bot.setControlState('sneak', false); } catch(e) {} }, rand(800, 2500));
      } catch(e) {}
    }, rand(2 * 60 * 1000, 6 * 60 * 1000));

    // Look at nearby players every 30-90 seconds
    setInterval(function() {
      if (connected < 1) return;
      try {
        var players = Object.values(bot.players).filter(p => p.entity && p.username !== username);
        if (players.length > 0) {
          var target = players[Math.floor(Math.random() * players.length)];
          bot.lookAt(target.entity.position.offset(0, 1.6, 0));
        }
      } catch(e) {}
    }, rand(30 * 1000, 90 * 1000));

    // Eat food when hungry
    bot.on('health', function() {
      if (connected < 1) return;
      if (bot.food < 18) {
        try {
          var foodItem = bot.inventory.items().find(item =>
            item.name.includes('bread') || item.name.includes('cooked') ||
            item.name.includes('apple') || item.name.includes('carrot') ||
            item.name.includes('potato') || item.name.includes('beef') ||
            item.name.includes('pork') || item.name.includes('chicken')
          );
          if (foodItem) {
            bot.equip(foodItem, 'hand').then(() => {
              bot.activateItem();
            }).catch(() => {});
          }
        } catch(e) {}
      }
    });
  });

  // Movement loop
  bot.on('time', function() {
    if (connected < 1) return;
    if (lasttime < 0) {
      lasttime = bot.time.age;
    } else {
      var interval = rand(2, 8) * 20;
      if (bot.time.age - lasttime > interval) {
        if (moving == 1) {
          try { bot.setControlState(lastaction, false); } catch(e) {}
          moving = 0;
          lasttime = bot.time.age;
        } else {
          // Sometimes stand still (act idle)
          if (Math.random() < 0.2) {
            lasttime = bot.time.age + rand(20, 60) * 20;
            return;
          }
          try {
            var yaw = Math.random() * pi * 2 - pi;
            var pitch = (Math.random() - 0.5) * pi * 0.5;
            bot.look(yaw, pitch, false);
            var actions = ['forward', 'forward', 'forward', 'back', 'left', 'right'];
            lastaction = actions[Math.floor(Math.random() * actions.length)];
            bot.setControlState(lastaction, true);
            moving = 1;
            lasttime = bot.time.age;
          } catch(e) {}
        }
      }
    }
  });

  bot.on('kicked', function(reason) {
    console.log("Bot was kicked:", JSON.stringify(reason));
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
    moving = 0;
    setTimeout(createBot, 60000);
  });
}

createBot();
