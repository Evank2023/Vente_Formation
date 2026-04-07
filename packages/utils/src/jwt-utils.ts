import * as jsonwebtoken from "jsonwebtoken";
const jwt = (jsonwebtoken as any).default || jsonwebtoken;

const jwtUtils = {
    generateToken(
        payload: object,
        secret: string,
        expiresIn: string | number = "1h",
    ): string {
        return jwt.sign(payload, secret, { expiresIn });
    },

    verifyToken(token: string, secret: string): object | null {
        return jwt.verify(token, secret);
    },
};

export default jwtUtils;
