// import { UserSchema, User } from "./user.model";
// import mongoose, {Schema, Document} from "mongoose";

// export interface MessageI extends Document {
//     text: string,
//     writtenBy: User;
//     address: string;
//     seat: number;
// }

// export const MessageSchema : Schema<MessageI> = new Schema(
//     {
//         text: {
//             type: String,
//             required: true,
//         },
//         writtenBy: UserSchema,
//         address: {
//             type: String,
//         },
//         seat: {
//             type: Number
//         }
//     }
// );


// export interface Chat extends Document {
//     user: User;
//     sender: User;
//     message: Schema.Types.ObjectId;
// };

// export const ChatSchema : Schema<Chat> = new Schema(
//     {
//         user: UserSchema,
//         sender: UserSchema,
//         message: [
//             {
//                 type: Schema.Types.ObjectId,
//                 ref: "Conclusion",
//             }
//         ],
//     }
// );

// const ChatModel = mongoose.model<Chat>("Chats", ChatSchema);
// export default ChatModel;