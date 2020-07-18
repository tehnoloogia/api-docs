import path from 'path'
import { ApiModel } from '@microsoft/api-extractor-model'

/**
 * setup ApiPackage Stub data
 */
const API_JSON1 = path.resolve(__dirname, './fixtures/my-library.api.json')
const API_JSON2 = path.resolve(__dirname, './fixtures/shared.api.json')
const model = new ApiModel()
const API_MODEL_FILES = [API_JSON1, API_JSON2]
const PACKAGES = API_MODEL_FILES.reduce((packages, file) => {
  return Object.assign(packages, { [file]: model.loadPackage(file) })
}, {})

// mock 'resolver' module
jest.mock('../src/resolver', () => {
  const { resolve } = jest.requireActual('../src/resolver')
  return {
    resolve,
    loadPackage: jest.fn().mockImplementation(modelPath => PACKAGES[modelPath]) // stub
  }
})

// mock 'utils' modules
jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  mkdir: jest.fn(),
  writeFile: jest.fn()
}))
import { mkdir, writeFile } from '../src/utils'

import { DefaultConfig, GenerateStyle } from '../src/config'
import { generate } from '../src/generator'

afterEach(() => {
  jest.clearAllMocks()
})

test('generate prefix style contents', async () => {
  const input = [API_JSON1, API_JSON2]
  const output = path.resolve(__dirname, './')
  await generate(input, output, GenerateStyle.Prefix, DefaultConfig)

  expect(mkdir).not.toHaveBeenCalled()
  expect(writeFile).toHaveBeenCalledTimes(7)
  for (const arg of writeFile.mock.calls) {
    expect(
      [
        path.resolve(output, './my-library-enum.md'),
        path.resolve(output, './my-library-function.md'),
        path.resolve(output, './my-library-variable.md'),
        path.resolve(output, './my-library-class.md'),
        path.resolve(output, './my-library-interface.md'),
        path.resolve(output, './my-library-typealias.md'),
        path.resolve(output, './shared-variable.md')
      ].includes(arg[0])
    ).toBe(true)
    expect(arg[1]).toMatchSnapshot()
  }
})

test('generate directory style contents', async () => {
  const input = [API_JSON1, API_JSON2]
  const output = path.resolve(__dirname, './')
  await generate(input, output, GenerateStyle.Directory, DefaultConfig)

  expect(mkdir).toHaveBeenCalledTimes(2)
  expect(mkdir.mock.calls[0][0]).toEqual(path.resolve(output, './my-library'))
  expect(mkdir.mock.calls[1][0]).toEqual(path.resolve(output, './shared'))

  const passedArgs = [
    path.resolve(output, './my-library/enum.md'),
    path.resolve(output, './my-library/function.md'),
    path.resolve(output, './my-library/variable.md'),
    path.resolve(output, './my-library/class.md'),
    path.resolve(output, './my-library/interface.md'),
    path.resolve(output, './my-library/typealias.md'),
    path.resolve(output, './shared/variable.md')
  ]
  expect(writeFile).toHaveBeenCalledTimes(7)
  for (const arg of writeFile.mock.calls) {
    expect(passedArgs.includes(arg[0])).toBe(true)
    expect(arg[1]).toMatchSnapshot()
  }
})
