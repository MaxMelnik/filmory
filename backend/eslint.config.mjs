import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([globalIgnores(['**/vue-frontend/', '**/dist/', '**/public/']), {
    extends: compat.extends('google', 'prettier'),

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        ecmaVersion: 'latest',
        sourceType: 'module',
    },

    rules: {
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-in-parens': ['error', 'never'],
        'comma-dangle': ['error', 'always-multiline'],

        'max-len': ['error', {
            code: 145,
            ignoreUrls: true,
        }],

        indent: ['error', 4, {
            SwitchCase: 1,
        }],

        'new-cap': 'off',
        'require-jsdoc': 'off',
        'valid-jsdoc': 'off',
        'linebreak-style': 'off',
        'no-console': 'off',
        'prefer-const': 'error',
    },
}]);
