import mongoose, { Schema, models } from 'mongoose';

interface IDriverData extends Document {
    _id: mongoose.Types.ObjectId;
    driverName: string;
    phoneNumber: string;
}

const driverDataSchema = new Schema<IDriverData>(
    {
        driverName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { collection: 'DriverData' }
);

const DriverData = models.DriverData || mongoose.model<IDriverData>('DriverData', driverDataSchema);

export default DriverData;
