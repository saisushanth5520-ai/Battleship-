const { Schema, model } = require('mongoose');

const gameHistorySchema = new Schema(
  {
    result: { type: String, enum: ['win', 'loss'], required: true },
    mode:   { type: String, enum: ['ai', 'pvp'],  required: true },
    date:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  gameHistory:  { type: [gameHistorySchema], default: [] },
});

module.exports = model('User', userSchema);
