import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
} from "../../config/jwt";

// HELPERS

function generateAccessToken(userId: number, email: string): string {
  return jwt.sign({ sub: userId, email }, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expiry;
}

export class AuthService {
  static async signUp(username: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) throw new Error("CORREO_REGISTRADO");

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    const accessToken = generateAccessToken(newUser.id, newUser.email);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const { password: _, ...userSafe } = newUser;
    return { user: userSafe, accessToken, refreshToken };
  }

  static async signIn(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new Error("CREDENCIALES_INVALIDAS");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("CREDENCIALES_INVALIDAS");

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const { password: _, ...userSafe } = user;
    return { user: userSafe, accessToken, refreshToken };
  }

  static async refresh(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) throw new Error("REFRESH_TOKEN_INVALIDO");
    if (storedToken.revokedAt) throw new Error("REFRESH_TOKEN_REVOCADO");
    if (storedToken.expiresAt < new Date())
      throw new Error("REFRESH_TOKEN_EXPIRADO");

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const newAccessToken = generateAccessToken(
      storedToken.userId,
      storedToken.user.email,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revokedAt) return;

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }
}
