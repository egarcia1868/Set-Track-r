// import User from "../models/UserModel.js";

// export default async function ensureUserExists(req, res, next) {
//   const auth0Id = req.auth?.sub;
//   if (!auth0Id) {
//     return res.status(401).json({ error: "Unauthorized: no auth0 ID found" });
//   }

//   try {
//     let user = await User.findOne({ auth0Id });

//     if (!user) {
//       user = new User({ auth0Id, artistsSeenLive: [] });
//       await user.save();
//       console.log(`✅ Created new user with Auth0 ID: ${auth0Id}`);
//     }

//     req.userDoc = user;
//     next();
//   } catch (err) {
//     console.error("User creation error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// }
