//  Copyright (C) 2022 Convexus
//
//  This file is part of convexus
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
    'packages/*/src',
    '<rootDir>/includes',
    '<rootDir>/node_modules',
    '<rootDir>/*/node_modules',
  ],
  moduleFileExtensions: ['js', 'ts', 'node', 'json'],
  moduleNameMapper: {
    '^@convexus/sdk': '<rootDir>/packages/sdk/src/index.ts',
    '^@convexus/sdk-core': '<rootDir>/packages/sdk-core/src/index.ts',
    '^@convexus/sdk-demo': '<rootDir>/packages/sdk-demo/src/index.ts'
  },
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  testURL: 'http://localhost',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/packages/*/src/**/*.{ts,js}',
    '!**/node_modules/**',
  ],
  testEnvironment: 'jsdom',
  automock: false,
  resetMocks: false,
  setupFiles: ['<rootDir>/jest-setup.js'],
};

module.exports = config;
