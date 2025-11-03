import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    partners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    password: { type: String, required: true },
    profileImage: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/2920/2920277.png",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
