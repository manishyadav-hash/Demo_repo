const { query } = require("../lib/db");
const { UnauthorizedException, NotFoundException } = require("../utils/app-error");
const { hashValue, compareValue } = require("../utils/bcrypt");

const HARDCODED_OTP = "12345";

const toPublicUser = (row) => {
    if (!row) return null;

    return {
        id: row.id,
        _id: row.id,
        name: row.name,
        email: row.email,
        phoneNumber: row.phoneNumber,
        avatar: row.avatar,
        fcmToken: row.fcmToken,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
};

const registerService = async (body) => {
    const { email } = body;

    const existingUserResult = await query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
    );

    if (existingUserResult.rows[0]) {
        throw new UnauthorizedException("User already exist");
    }

    const hashedPassword = await hashValue(body.password);

    const createUserResult = await query(
        `
        INSERT INTO users (name, email, password, avatar, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, name, email, "phoneNumber", avatar, "fcmToken", "createdAt", "updatedAt"
        `,
        [body.name, body.email, hashedPassword, body.avatar || null]
    );

    return toPublicUser(createUserResult.rows[0]);
};

const loginService = async (body) => {
    const { email, password } = body;

    const userResult = await query(
        `
        SELECT id, name, email, "phoneNumber", password, avatar, "fcmToken", "createdAt", "updatedAt"
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
        [email]
    );

    const user = userResult.rows[0];

    if (!user) {
        throw new NotFoundException("Email or Password not found");
    }

    const isPasswordValid = await compareValue(password, user.password);

    if (!isPasswordValid) {
        throw new UnauthorizedException("Invaild email or password");
    }

    return toPublicUser(user);
};

const sendPhoneOtpService = async (body) => {
    const { phoneNumber } = body;

    return {
        phoneNumber,
        otp: HARDCODED_OTP,
    };
};

const verifyPhoneOtpService = async (body) => {
    const { email, phoneNumber, otp } = body;

    if (otp !== HARDCODED_OTP) {
        throw new UnauthorizedException("Invalid OTP");
    }

    const userResult = await query(
        `
        SELECT id, name, email, "phoneNumber", avatar, "fcmToken", "createdAt", "updatedAt"
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
        [email]
    );

    const user = userResult.rows[0];

    if (!user) {
        throw new NotFoundException("Account not found for this email");
    }

    if (user.phoneNumber && user.phoneNumber !== phoneNumber) {
        throw new UnauthorizedException("Phone number does not match this account");
    }

    if (!user.phoneNumber) {
        const updatedUserResult = await query(
            `
            UPDATE users
            SET "phoneNumber" = $1, "updatedAt" = NOW()
            WHERE id = $2
            RETURNING id, name, email, "phoneNumber", avatar, "fcmToken", "createdAt", "updatedAt"
            `,
            [phoneNumber, user.id]
        );

        return toPublicUser(updatedUserResult.rows[0]);
    }

    return toPublicUser(user);
};

module.exports = {
    registerService,
    loginService,
    sendPhoneOtpService,
    verifyPhoneOtpService,
};
