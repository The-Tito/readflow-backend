import { Request, Response } from "express";
export declare class AuthController {
    static signUp(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static signIn(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=auth.controller.d.ts.map