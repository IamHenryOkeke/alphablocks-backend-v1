import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  // createUser,
  // getUserByEmail,
  // // getUserByGoogleId,
  // updateUser,
  getUserById,
} from "../db/user.queries";
import { getEnv } from "./env";
import { JwtPayload } from "../types/auth";
import { User } from "../generated/prisma/client";

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: getEnv("JWT_SECRET"),
};

const toUserData = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      const user = await getUserById(jwt_payload.id);
      if (!user) return done(null, false);
      return done(null, toUserData(user));
    } catch (error) {
      return done(error, false);
    }
  }),
);

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: getEnv("GOOGLE_CLIENT_ID"),
//       clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
//       callbackURL: "http://localhost:5000/api/auth/google/callback",
//     },
//     async function (accessToken, refreshToken, profile, done) {
//       try {
//         const googleId = profile.id;
//         const email = profile.emails?.[0].value || "";
//         const name = profile.displayName;
//         const image = profile.photos?.[0].value;
//         const isVerified = profile.emails?.[0].verified === true;

//         const existingUserByGoogleId = await getUserByGoogleId(googleId);
//         if (existingUserByGoogleId)
//           return done(null, toUserData(existingUserByGoogleId));

//         const existingUserByEmail = await getUserByEmail(email.toLowerCase());

//         if (existingUserByEmail) {
//           const values = {
//             googleId,
//             ...(!existingUserByEmail.image && { image }),
//             ...(!existingUserByEmail.name && { name }),
//             isVerified,
//           };
//           const updatedUser = await updateUser(existingUserByEmail.id, values);
//           return done(null, toUserData(updatedUser));
//         }

//         const values = {
//           googleId,
//           email,
//           name,
//           image,
//           isVerified,
//         };

//         const newUser = await createUser(values);
//         return done(null, toUserData(newUser));
//       } catch (err) {
//         console.error("Google OAuth error:", err);
//         done(err);
//       }
//     },
//   ),
// );

export default passport;
