const { Markup } = require('telegraf');
const { Scene } = require('telegraf-flow');
const { scrobbleAlbum } = require('../helpers/scrobbler');
const { findUserByIdAndUpdate } = require('../helpers/dbmanager');


const editAlbumScene = new Scene('edit_album');

editAlbumScene.enter(async (ctx) => {
  const tracks = ctx.user.album.tracks;
  await ctx.editMessageText('Edit the track list and send it back to me:');
  await ctx.reply(`${tracks.map(track => track.name).join('\n')}`,
    Markup.inlineKeyboard([
      Markup.callbackButton('Cancel', 'CANCEL'),
    ]).extra());
});

editAlbumScene.on('text', async (ctx) => {
  const tracks = ctx.message.text.split('\n').map(name => ({ name }));
  ctx.user = await findUserByIdAndUpdate(ctx.from.id, { 'album.tracks': tracks });
  await scrobbleAlbum(ctx);
});

module.exports = editAlbumScene;
