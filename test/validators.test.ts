import {describe, expect, test} from 'vitest'
import {AttributeType, CollectionAttributesSchema} from '../src/types'
import {validateCollectionAttributesSchema} from '../src/tools/validators'

describe('validateCollectionAttributesSchema tests:', () => {
  test('Right collection attributes', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(validateCollectionAttributesSchema(test_attribute, 'testVar')).toBe(true)
  })

  test('Collection Attributes is not an object', () => {
    const number = 1
    expect(() => validateCollectionAttributesSchema(number, 'testVar')).toThrowError('is not an object')
  })

  test('Collection Attributes is undefined', () => {
    expect(() => validateCollectionAttributesSchema(undefined, 'testVar')).toThrowError()
  })

  test('Collection Attributes is null', () => {
    expect(() => validateCollectionAttributesSchema(null, 'testVar')).toThrowError()
  })

  test('Collection Attributes is set', () => {
    const set = new Set()
    expect(() => validateCollectionAttributesSchema(set, 'testVar')).toThrowError('is a Set, should be plain object')
  })

  test('Collection Attributes is map', () => {
    const map = new Map()
    expect(() => validateCollectionAttributesSchema(map, 'testVar')).toThrowError('is a Map, should be plain object')
  })

  test('Collection Attributes is array', () => {
    const arr = [1, 2, 3]
    expect(() => validateCollectionAttributesSchema(arr, 'testVar')).toThrowError('is an array, should be plain object')
  })

  test('Key is string', () => {
    const test_attribute: CollectionAttributesSchema = {
      ['key1' as any as number]: {
        name: {_: 'test'},
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('is not a valid number key')
  })

  test('Key is NaN', () => {
    const nan = 0 / 0;
    const test_attribute: CollectionAttributesSchema = {}

    test_attribute[nan] = {
      name: {_: 'test'},
      type: AttributeType.string,
      enumValues: {
        '0': {_: 'test0'},
        '1': {_: 'test1'},
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('is not a valid number key')
  })

  test('Key is float', () => {
    const float = 22 / 7
    const test_attribute: CollectionAttributesSchema = {}

    test_attribute[float] = {
      name: {_: 'test'},
      type: AttributeType.string,
      enumValues: {
        '0': {_: 'test0'},
        '1': {_: 'test1'},
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('is not a valid number key')
  })

  test('attributes is number', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': 1 as any
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('is not an object')
  })

  test('attributes is map', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': new Map() as any
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be plain object')
  })

  test('attributes is set', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': new Set() as any
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be plain object')
  })

  test('attributes is null', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': null as any
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be valid object')
  })

  test('attributes is array', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': [1, 2, 3] as any
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be plain object')
  })

  test('attributes.name empty object', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {} as any,
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('empty object')
  })

  test('attributes.name dict key is not a string', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test', 1: 'bad test'} as any,
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid Language code')
  })

  test('attributes.name dict key does not match regex', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test', 'ru-RUS': 'test'} as any,
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid Language code')
  })

  test('attributes.optional should be boolean', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        optional: 1 as any,
        type: AttributeType.string,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be boolean')
  })

  test('attributes.type should be valid type', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: 'wrong-type' as any,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid attribute type')
  })

  test('attributes.type should possible attribute type', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: 0xff as any,
        enumValues: {
          '0': {_: 'test0'},
          '1': {_: 'test1'},
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid attribute type')
  })

  test('attributes.enumValues typeof(number) !== number', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.string,
        enumValues: {
          ['a' as any]: {_: 'test'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('is not a valid number')
  })

  test('attributes.enumValues value number type: wrong number', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.integer,
        enumValues: {
          '0': {_: 'aaa'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError(/integer/)
  })

  test('attributes.enumValues value boolean type: wrong number', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.boolean,
        enumValues: {
          '0': {_: 123}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError(/boolean/)
  })

  test('attributes.enumValues value string type: wrong isoDate', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.isoDate,
        enumValues: {
          '0': {_: '202206:25'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid ISO Date')
  })

  test('attributes.enumValues value string type: wrong time', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.time,
        enumValues: {
          '0': {_: '1:65'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid time in')
  })

  test('attributes.enumValues value string type: rgb', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.colorRgba,
        enumValues: {
          '0': {_: '#aabbcx'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid rgb or rgba color')
  })

  test('attributes.enumValues value string type: rgba', () => {
    const test_attribute: CollectionAttributesSchema = {
      '1': {
        name: {_: 'test'},
        type: AttributeType.colorRgba,
        enumValues: {
          '0': {_: '#aabbccdx'}
        }
      }
    }

    expect(() => validateCollectionAttributesSchema(test_attribute, 'testVar')).toThrowError('should be a valid rgb or rgba color')
  })
})
