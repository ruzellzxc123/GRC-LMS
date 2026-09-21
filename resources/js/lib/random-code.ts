const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIALS = '!@#$%^&*-_=+';

function randomChar(pool: string): string {
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generates a random code containing at least one uppercase letter, one
 * lowercase letter, one number, and one special character, at a minimum
 * length of 10.
 */
export function generateRandomCode(length = 10): string {
    const targetLength = Math.max(length, 10);
    const pools = [UPPERCASE, LOWERCASE, NUMBERS, SPECIALS];
    const allCharacters = pools.join('');

    const characters = pools.map((pool) => randomChar(pool));

    while (characters.length < targetLength) {
        characters.push(randomChar(allCharacters));
    }

    for (let i = characters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [characters[i], characters[j]] = [characters[j], characters[i]];
    }

    return characters.join('');
}
