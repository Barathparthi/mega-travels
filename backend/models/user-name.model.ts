
import mongoose, { Schema, models } from 'mongoose';

const userNameSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
        },
    },
    { collection: 'UserName' } // Explicitly map to existing 'UserName' collection
);

const UserName = models.UserName || mongoose.model('UserName', userNameSchema);

export default UserName;
