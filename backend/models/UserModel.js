import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";

const { isEmail } = validator;

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter an email."],
      unique: true,
      lowerCase: true,
      validate: [isEmail, "Please enter a valid email."],
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
      minlength: [6, "Minimum password length is 6 characters"],
    },
  },
  { timestamps: true }
);

// fire a function after doc saved to db
userSchema.post('save', function (doc, next) {
  console.log('new user was created & saved', doc);
  next();
})

// fire a function before doc saved to db
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
})

export default model("User", userSchema);
