import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../lib/prisma";
import {
  createUser,
  getUserByEmail,
  getUserByGoogleId,
  updateUser,
} from "../db/user.queries";
interface JwtPayload {
  id: string;
}

const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload: JwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwt_payload.id },
      });

      const data = {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        image: user?.image,
        role: user?.role,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      };

      if (user) return done(null, data);
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0].value || "";
        const name = profile.displayName;
        const image = profile.photos?.[0].value;

        const existingUserByGoogleId = await getUserByGoogleId(googleId);
        if (existingUserByGoogleId) return done(null, existingUserByGoogleId);

        const existingUserByEmail = await getUserByEmail(
          email.toLowerCase() || "",
        );
        if (existingUserByEmail) {
          const values = {
            googleId,
            ...(!existingUserByEmail.image && { image }),
            ...(!existingUserByEmail.name && { name }),
            isVerified: true,
          };
          const updatedUser = await updateUser(existingUserByEmail.id, values);
          return done(null, updatedUser);
        }

        const values = {
          googleId,
          email,
          name,
          image,
        };

        const newUser = await createUser(values);
        return done(null, newUser);
      } catch (err) {
        console.error("Google OAuth error:", err);
        done(err);
      }
    },
  ),
);

export default passport;
