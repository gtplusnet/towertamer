import mongoose, { Document, Schema } from 'mongoose';

// Tile-related interfaces matching frontend types
export interface IGridPosition {
  row: number;
  col: number;
}

export interface IPortalData {
  targetMapId: mongoose.Types.ObjectId;
  targetPosition: IGridPosition;
}

export interface ITile {
  terrain: 'none' | 'grass' | 'water' | 'wall' | 'tree' | 'barrier' | 'portal';
  walkable: boolean;
  portalData?: IPortalData;
}

export interface IMap extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  width: number;
  height: number;
  tiles: ITile[][];
  backgroundImage?: string; // Optional URL/path to uploaded background image
  isPublished: boolean;
  isDefaultSpawn: boolean;
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// GridPosition sub-schema
const gridPositionSchema = new Schema<IGridPosition>(
  {
    row: {
      type: Number,
      required: true,
    },
    col: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// PortalData sub-schema
const portalDataSchema = new Schema<IPortalData>(
  {
    targetMapId: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: true,
    },
    targetPosition: {
      type: gridPositionSchema,
      required: true,
    },
  },
  { _id: false }
);

// Tile sub-schema
const tileSchema = new Schema<ITile>(
  {
    terrain: {
      type: String,
      enum: ['none', 'grass', 'water', 'wall', 'tree', 'barrier', 'portal'],
      required: true,
    },
    walkable: {
      type: Boolean,
      required: true,
    },
    portalData: {
      type: portalDataSchema,
      required: false,
    },
  },
  { _id: false }
);

// Main Map schema
const mapSchema = new Schema<IMap>(
  {
    name: {
      type: String,
      required: [true, 'Map name is required'],
      trim: true,
      minlength: [3, 'Map name must be at least 3 characters'],
      maxlength: [100, 'Map name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Map slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    width: {
      type: Number,
      required: [true, 'Map width is required'],
      min: [5, 'Map width must be at least 5 tiles'],
      max: [100, 'Map width cannot exceed 100 tiles'],
    },
    height: {
      type: Number,
      required: [true, 'Map height is required'],
      min: [5, 'Map height must be at least 5 tiles'],
      max: [100, 'Map height cannot exceed 100 tiles'],
    },
    tiles: {
      type: [[tileSchema]],
      required: [true, 'Map tiles are required'],
      validate: {
        validator: function (this: IMap, tiles: ITile[][]) {
          // Validate that tiles array matches declared height
          if (tiles.length !== this.height) {
            return false;
          }
          // Validate that each row matches declared width
          for (const row of tiles) {
            if (row.length !== this.width) {
              return false;
            }
          }
          return true;
        },
        message: 'Tiles array dimensions must match width and height',
      },
    },
    backgroundImage: {
      type: String,
      required: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isDefaultSpawn: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure only one map has isDefaultSpawn = true
mapSchema.pre('save', async function (next) {
  const map = this as IMap;

  // If this map is being set as default spawn
  if (map.isDefaultSpawn && map.isModified('isDefaultSpawn')) {
    try {
      // Set all other maps to isDefaultSpawn = false
      await mongoose.model('Map').updateMany(
        { _id: { $ne: map._id } },
        { $set: { isDefaultSpawn: false } }
      );
    } catch (error: any) {
      return next(error);
    }
  }

  next();
});

// Create indexes
mapSchema.index({ slug: 1 }, { unique: true });
mapSchema.index({ isPublished: 1 });
mapSchema.index({ isDefaultSpawn: 1 });
mapSchema.index({ createdBy: 1 });
mapSchema.index({ createdAt: -1 });

export const Map = mongoose.model<IMap>('Map', mapSchema);
