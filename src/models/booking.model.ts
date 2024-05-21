import mongoose, { Document, Schema } from 'mongoose';

export interface BookingI extends Document {
    user: Schema.Types.ObjectId;
    tripId: Schema.Types.ObjectId;
    noOfSeat: number;
    from: string;
    to: string;
}

export const BookingSchema: Schema<BookingI> = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    tripId: {
        type: Schema.Types.ObjectId,
        ref: "Trip",
    },
    noOfSeat: {
        type: Number,
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
});

const Booking = mongoose.model<BookingI> ("Booking", BookingSchema);
export default Booking;