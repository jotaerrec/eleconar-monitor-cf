const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export type PasswordHashParts = {
	hash: string;
	iterations: number;
	salt: string;
};

export async function hashPassword(password: string): Promise<PasswordHashParts> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const derived = await derive(password, salt, PASSWORD_ITERATIONS);
	return {
		hash: toBase64(derived),
		iterations: PASSWORD_ITERATIONS,
		salt: toBase64(salt),
	};
}

export async function verifyPassword(password: string, input: PasswordHashParts): Promise<boolean> {
	const derived = await derive(password, fromBase64(input.salt), input.iterations);
	return timingSafeEqual(toBase64(derived), input.hash);
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			hash: "SHA-256",
			salt: toArrayBuffer(salt),
			iterations,
		},
		key,
		PASSWORD_KEY_LENGTH * 8,
	);

	return new Uint8Array(bits);
}

function toBase64(input: Uint8Array) {
	return Buffer.from(input).toString("base64");
}

function fromBase64(input: string) {
	return new Uint8Array(Buffer.from(input, "base64"));
}

function toArrayBuffer(input: Uint8Array) {
	const copy = new Uint8Array(input.byteLength);
	copy.set(input);
	return copy.buffer as ArrayBuffer;
}

function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i += 1) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}
