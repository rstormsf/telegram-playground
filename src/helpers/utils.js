const { Markup } = require('telegraf');
const crypto = require('crypto');
const songs = require('../songs');
const { findUserByIdAndUpdate, createSucceededMessage, createFailedMessage } = require('./dbmanager');
const { ADMIN_ID } = require('../../config');
const querystring = require('querystring');


const GLOBAL_KEYBOARD = Markup.keyboard([['🎵 Track', '💽 Album', '📃 Tracklist']]).resize().extra();

function sendToAdmin(ctx, text) {
  return ctx.telegram.sendMessage(ADMIN_ID, text);
}

function md5(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

function getRandomFavSong() {
  const index = Math.floor(Math.random() * songs.length);
  return songs[index];
}

async function error(ctx, e) {
  console.log(e);
  const errText = '❗️ Oops, something went wrong. Please try again later.';

  if (ctx.callbackQuery) {
    await ctx.editMessageText(errText);
  } else {
    await ctx.reply(errText);
  }

  ctx.leaveScene();
  return sendToAdmin(ctx, '❗️ An error occured. Check the logs...');
}

function utf8(text) {
  return decodeURI(decodeURIComponent(text));
}

async function successfulScrobble(ctx, text = '✅ Success!', tracks = []) {
  await findUserByIdAndUpdate(ctx.from.id, {
    $inc: { scrobbles: 1 },
    username: ctx.from.username,
    last_scrobble: new Date(),
    album: {},
    track: {},
  });

  const extra = Markup.inlineKeyboard([
    Markup.callbackButton('Repeat', 'REPEAT'),
  ]).extra();

  let message;

  if (ctx.callbackQuery) {
    message = await ctx.editMessageText(text, extra);
  } else if (ctx.messageToEdit) {
    message = await ctx.telegram
      .editMessageText(ctx.chat.id, ctx.messageToEdit.message_id, null, text, extra);
  } else {
    message = await ctx.reply(text, extra);
  }

  await createSucceededMessage(message.message_id, tracks);
  ctx.leaveScene();
}

function canScrobble(user) {
  if (Date.now() - +user.last_scrobble <= 30000) {
    return false;
  }

  return true;
}

function multipleArray(array = [], multipleTimes = 1) {
  let multipliedArray = [];

  if (multipleTimes > 1) {
    for (let i = 0; i < multipleTimes; i += 1) {
      multipliedArray = multipliedArray.concat(array);
    }

    return multipliedArray;
  }

  return array;
}

function fromQuerystringToTracksArray(querystr = '') {
  const tracks = [];
  const obj = querystring.parse(querystr);
  const tracksCount = Object.keys(obj).filter(key => key.includes('track')).length;

  for (let i = 0; i < tracksCount; i += 1) {
    tracks.push({
      name: obj[`track[${i}]`],
      artist: obj[`artist[${i}]`],
      album: obj[`album[${i}]`],
    });
  }

  return tracks;
}

function fromTracksArrayToQuerystring(tracksArray = []) {
  const objectToQuerystring = {};

  tracksArray.forEach((track, i) => {
    objectToQuerystring[`track[${i}]`] = track.name;
    objectToQuerystring[`artist[${i}]`] = track.artist;
    objectToQuerystring[`album[${i}]`] = track.album;
  });

  return utf8(querystring.stringify(objectToQuerystring));
}

async function scrobbleError(ctx, e) {
  const extra = Markup.inlineKeyboard([
    Markup.callbackButton('Retry', 'RETRY'),
  ]).extra();

  let messageId;

  if (ctx.messageToEdit) {
    messageId = ctx.messageToEdit.message_id;
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, null, e.message, extra);
  } else if (ctx.callbackQuery) {
    messageId = ctx.callbackQuery.message.message_id;
    await ctx.editMessageText(e.message, extra);
  } else {
    const res = await ctx.reply(e.message, extra);
    messageId = res.message_id;
  }

  await createFailedMessage(messageId, fromQuerystringToTracksArray(e.config.data));
  return ctx.leaveScene();
}

async function requestError(ctx, e) {
  if (e.response && e.response.data) {
    const err = e.response.data.error;

    if (err === 14 || err === 4 || err === 9) {
      const text = '❌ Access has not been granted. Please re-authenticate';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(text);
      } else {
        await ctx.reply(text);
      }

      return ctx.enterScene('auth');
    }
  }

  e.message = '❌ Failed';
  return scrobbleError(ctx, e);
}

async function isUserAuthorized(ctx) {
  return ctx.user && ctx.user.key;
}

function validateTracksDurations(tracks = []) {
  const defDur = 300;
  return tracks.map((track) => {
    let duration = 0;
    const td = track.duration;

    if (tracks.length === 1) {
      return Object.assign(track, { duration });
    }

    duration = typeof td === 'undefined' ? defDur : +td || defDur;
    return Object.assign(track, { duration });
  });
}

module.exports = {
  sendToAdmin,
  md5,
  getRandomFavSong,
  utf8,
  successfulScrobble,
  canScrobble,
  error,
  scrobbleError,
  requestError,
  isUserAuthorized,
  GLOBAL_KEYBOARD,
  multipleArray,
  fromQuerystringToTracksArray,
  fromTracksArrayToQuerystring,
  validateTracksDurations,
};
