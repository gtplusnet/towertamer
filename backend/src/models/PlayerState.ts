import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerState extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  username: string; // Denormalized for quick lookup
  currentMap: mongoose.Types.ObjectId;
  position: {
    row: number;
    col: number;
  };
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  isOnline: boolean;
  socketId: string | null;
  lastUpdate: Date;
}

const playerStateSchema = new Schema<IPlayerState>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    currentMap: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: true,
    },
    position: {
      row: {
        type: Number,
        required: true,
        default: parseInt(process.env.DEFAULT_SPAWN_ROW || '10'),
      },
      col: {
        type: Number,
        required: true,
        default: parseInt(process.env.DEFAULT_SPAWN_COL || '15'),
      },
    },
    direction: {
      type: String,
      enum: ['up', 'down', 'left', 'right', 'idle'],
      default: 'idle',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
      default: null,
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
playerStateSchema.index({ userId: 1 });
playerStateSchema.index({ currentMap: 1, isOnline: 1 }); // For fetching players on a specific map
playerStateSchema.index({ socketId: 1 });
playerStateSchema.index({ isOnline: 1, lastUpdate: -1 }); // For cleanup queries

// Update lastUpdate on save
playerStateSchema.pre('save', function (next) {
  this.lastUpdate = new Date();
  next();
});

export const PlayerState = mongoose.model<IPlayerState>(
  'PlayerState',
  playerStateSchema
);
