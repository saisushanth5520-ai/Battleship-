const { Schema, model } = require('mongoose');

const gameSchema = new Schema(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponentId:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
    mode:        { type: String, enum: ['ai', 'pvp'], required: true },
    status:      { type: String, enum: ['active', 'finished'], required: true },
    result:      { type: String, enum: ['win', 'loss'], default: null },
    playerBoard: { type: Object, default: {} },
    aiBoard:     { type: Object, default: {} },
    aiState:     { type: Object, default: {} },
    currentTurn: { type: String, enum: ['player', 'ai'], default: 'player' },
  },
  { timestamps: true }
);

module.exports = model('Game', gameSchema);
