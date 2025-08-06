import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.SERVER_BASE_URL}/api/auth/google/callback`
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

export const googleAuth = async (req, res) => {
  res.redirect(authorizationUrl);
};

export const googleAuthallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Kode tidak ditemukan");
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    if (!data) {
      return res.status(404).json({ message: "Data pengguna tidak ditemukan" });
    }

    const { email, name, picture } = data;

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profile: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          profile: {
            create: {
              avatar: picture,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          profile: true,
        },
      });
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = 60 * 60 * 2;
    const token = await jwt.sign({ name, email, picture }, secret, {
      expiresIn,
    });
    res.cookie("access_token", token, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
    });
    return res.redirect(`${process.env.CLIENT_BASE_URL}`);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Terjadi kesalahan saat memproses permintaan");
  }
};

export const rememberMe = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id },
      include: { bussiness: true, profile: true },
    });
    if (user) {
      res.json({ status: true, data: user });
    } else {
      res.status(404).json({
        status: false,
        message: "user not found",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};
