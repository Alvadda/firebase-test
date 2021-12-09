import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  verbose: true,
  testEnvironment: 'jsdom',
  coverageReporters: ['json', 'html'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'babel-jest',
  },
  roots: ['./src'],
  moduleDirectories: ['node_modules'],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
}
export default config
