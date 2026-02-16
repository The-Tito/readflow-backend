import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../config/jwt";

export class AuthService {
  static async signUp(username: string, email: string, password: string) {
    const existingUser = await prisma.users.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      throw new Error("CORREO_REGISTRADO");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { sub: newUser.id, email: newUser.email },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN as any },
    );

    const { password: _, ...userSafe } = newUser;
    return { user: userSafe, token };
  }

  static async signIn(email: string, password: string) {
    const user = await prisma.users.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("CREDENCIALES_INVALIDAS");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("CREDENCIALES_INVALIDAS");
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      JWT_SECRET as jwt.Secret,
      {
        expiresIn: JWT_EXPIRES_IN as any,
      },
    );

    const { password: _, ...userSafe } = user;
    return { user: userSafe, token };
  }
}
