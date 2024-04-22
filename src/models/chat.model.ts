import { UserSchema, User } from "./user.model.js";
import mongoose, {Schema, Document} from "mongoose";

export interface Message extends Document {
    text: string,
    writtenBy: User;
    address: string;
    seat: number;
}

export const MessageSchema : Schema<Message> = new Schema(
    {
        text: {
            type: String,
            required: true,
        },
        writtenBy: UserSchema,
        address: {
            type: String,
        },
        seat: {
            type: Number
        }
    }
);


export interface Chat extends Document {
    user: User;
    sender: User;
    message: [Message];
};

export const ChatSchema : Schema<Chat> = new Schema(
    {
        user: UserSchema,
        sender: UserSchema,
        message: [MessageSchema]
    }
);

const ChatModel = mongoose.model<Chat>("Chats", ChatSchema);
export default ChatModel;