import mongoose, { Document, Schema } from 'mongoose';
import { User, UserSchema } from './user.model.ts';
import { Trip, TripSchema } from './trip.model.ts';
import { Location, LocationSchema } from './trip.model.ts';

export interface BookingDetails extends Document {
    user: User;
    tripId: Trip;
    noOfseat: number;
    from: Location;
    to: Location;
}

export const BookingDetailSchema: Schema<BookingDetails> = new Schema({
    user: {
        type: UserSchema,
        required: true,
    },
    tripId: TripSchema,
    noOfseat: {
        type: Number,
        required: true,
    },
    from: {
        type: LocationSchema,
        required: true,
    },
    to: {
        type: LocationSchema,
        required: true,
    },
});

const BookingModel = mongoose.model<BookingDetails> ("Users", BookingDetailSchema);
export default BookingModel;