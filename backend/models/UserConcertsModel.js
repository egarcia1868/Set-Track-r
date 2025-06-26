import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userConcertsSchema = new Schema(
  {
    userId: {
      type: String,
      required    },
    artistId: {
      type: String,
      required: true,
    },
    concertId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// fire a function after doc saved to db
userConcertsSchema.post("save", function (doc, next) {
  console.log("new user concert was created & saved", doc);
  next();
});

// // fire a function before doc saved to db
// userSchema.pre('save', async function (next) {
//   const salt = await bcrypt.genSalt();
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// })

export default model("UserConcerts", userConcertsSchema);
