export declare class AuthService {
    static signUp(username: string, email: string, password: string): Promise<{
        user: {
            id: number;
            email: string;
            username: string;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    static signIn(email: string, password: string): Promise<{
        user: {
            id: number;
            email: string;
            username: string;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
}
//# sourceMappingURL=AuthService.d.ts.map