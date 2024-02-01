import {describe, expect, test} from 'vitest'
import {Semver} from '../src/tools/semver'

describe('semver', () => {
  const strings = {
    v100: '1.0.0',
    v123: '1.2.3',
    v124: '1.2.4',
    v154: '1.5.4',
    v200: '2.0.0',
    invalid: 'sdd.fs.df',
    empty: '',
    undef: undefined as any as string,
  }
  const semvers = {
    v100: Semver.fromString(strings.v100),
    v123: Semver.fromString(strings.v123),
    v124: Semver.fromString(strings.v124),
    v154: Semver.fromString(strings.v154),
    v200: Semver.fromString(strings.v200),
  }

  test.concurrent('semver', () => {
    expect(semvers.v100.isLessThan(strings.v123)).toBe(true)
    expect(semvers.v100.isLessThan(strings.v154)).toBe(true)
    expect(semvers.v100.isLessThan(strings.v200)).toBe(true)
    expect(semvers.v123.isLessThan(strings.v124)).toBe(true)
    expect(semvers.v123.isLessThan(strings.v154)).toBe(true)
    expect(semvers.v123.isLessThan(strings.v200)).toBe(true)

    expect(semvers.v200.isGteThan(strings.v154)).toBe(true)
    expect(semvers.v200.isGteThan(strings.v100)).toBe(true)
    expect(semvers.v154.isGteThan(strings.v124)).toBe(true)
    expect(semvers.v124.isGteThan(strings.v123)).toBe(true)

    expect(semvers.v124.isGteThan('1.2.4')).toBe(true)
    expect(semvers.v124.isLessThan('1.2.4')).toBe(false)

    expect(semvers.v124.isEqual('1.2.4')).toBe(true)
    expect(semvers.v124.isEqual('1.2.5')).toBe(false)
    expect(semvers.v124.isEqual('1.3.4')).toBe(false)
    expect(semvers.v124.isEqual('2.2.4')).toBe(false)

    expect(Semver.isValid(strings.invalid)).toBe(false)
    expect(Semver.isValid(strings.empty)).toBe(false)
    expect(Semver.isValid(strings.undef)).toBe(false)
    expect(Semver.isValid(strings.v200)).toBe(true)

    expect(() => {
      Semver.fromString(strings.invalid)
    }).toThrowError()
    expect(() => {
      Semver.fromString(strings.empty)
    }).toThrowError()
    expect(() => {
      Semver.fromString(strings.undef)
    }).toThrowError()
  })
})
