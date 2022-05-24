//  Copyright (C) 2022 Convexus
//
//  This file is part of Convexus SDK
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
const config = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/packages/**/test/*.test.ts',
    '<rootDir>/packages/**/test/*.spec.ts'
  ],
  moduleDirectories: [
    '<rootDir>/packages/sdk/src',
    '<rootDir>/packages/sdk-core/src',
    '<rootDir>/node_modules',
    '<rootDir>/*/node_modules',
  ],
  moduleNameMapper: {
    // '@convexus/sdk': '<rootDir>/packages/sdk/src/index.ts',
    '@convexus/sdk-core': '<rootDir>/packages/sdk-core/src/index.ts',
    // '@convexus/sdk-demo': '<rootDir>/packages/sdk-demo/src/index.ts'
  },
  moduleFileExtensions: ['js', 'ts', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
};

module.exports = config;
