export interface CharacterInfo {
    characterImage: string;
    characterName: string;
    level: number;
    exp: number;
    nextLevelExp: number;
    expPercent: number;
}

export const getCharacterImageByLevel = (level: number): string => {
    switch (level) {
        case 1: return "🐣";
        case 2: return "🐤";
        case 3: return "🐔";
        default: return "🐣";
    }
};

export const getCharacterNameByLevel = (level: number): string => {
    switch (level) {
        case 1: return "새싹";
        case 2: return "성장";
        case 3: return "완성";
        default: return "새싹";
    }
};

export const getNextLevelExp = (currentLevel: number): number => {
    switch (currentLevel) {
        case 1: return 50;
        case 2: return 100;
        case 3: return 100; // 최고 레벨
        default: return 50;
    }
};

export const calculateExpPercent = (exp: number, level: number): number => {
    if (level === 1) return Math.min(exp, 50) * 2; // 0-50 exp = 0-100%
    else if (level === 2) return Math.min(exp - 50, 50) * 2; // 50-100 exp = 0-100%
    else if (level === 3) return 100; // 100+ exp = 100%
    return 0;
};

export const getCharacterInfo = (exp: number, level: number): CharacterInfo => {
    const nextLevelExp = getNextLevelExp(level);
    const expPercent = calculateExpPercent(exp, level);

    return {
        characterImage: getCharacterImageByLevel(level),
        characterName: getCharacterNameByLevel(level),
        level,
        exp,
        nextLevelExp,
        expPercent
    };
};