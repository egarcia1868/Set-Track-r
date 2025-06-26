import { auth } from 'express-oauth2-jwt-bearer';
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        auth0Id: {
            type: String,
            required: true,
            unique: true,
        },
        attendedConcerts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'UserConcerts',
            },
        ],
    });

    module.exports = model('User', userSchema);