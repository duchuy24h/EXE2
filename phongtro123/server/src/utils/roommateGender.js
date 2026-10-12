const GENDER_ALIASES = {
    nam: ['nam', 'male', 'man'],
    nu: ['nữ', 'nu', 'female', 'woman'],
    khac: ['khác', 'khac', 'other', 'non-binary', 'nonbinary'],
};

const normalizeRoommateGender = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    const normalized = value
        .trim()
        .toLocaleLowerCase('vi')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (GENDER_ALIASES.nam.includes(normalized)) return 'Nam';
    if (GENDER_ALIASES.nu.includes(normalized)) return 'Nữ';
    if (GENDER_ALIASES.khac.includes(normalized)) return 'Khác';
    return '';
};

const getRoommateGenderRegex = (value) => {
    const gender = normalizeRoommateGender(value);
    if (!gender) {
        return null;
    }

    const aliases =
        gender === 'Nam'
            ? GENDER_ALIASES.nam
            : gender === 'Nữ'
              ? GENDER_ALIASES.nu
              : GENDER_ALIASES.khac;
    const pattern = aliases
        .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    return new RegExp(`^\\s*(?:${pattern})\\s*$`, 'i');
};

module.exports = { normalizeRoommateGender, getRoommateGenderRegex };
