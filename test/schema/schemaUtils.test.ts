import {describe, test, expect} from 'vitest'
import {converters2Layers} from '../../src/schemaUtils'

describe('schemaUtils', async () => {
  const nestedObject = {
    foo: 'a',
    bar: 1,
    arr: [1, {foo: [{bar: 'baz'}]}],
    baz: {
      foo: {
        bar: 1,
        arr2: [
          1, 2, {bar2: 'baz'}
        ]
      }
    },
  }

  const properties = [
    {key: 'foo', value: '"a"'},
    {key: 'bar', value: '1'},
    {key: 'arr', value: '[1,{"foo":[{"bar":"baz"}]}]'},
    {key: 'baz.foo', value: '{"bar":1,"arr2":[1,2,{"bar2":"baz"}]}'},
  ]

  test.concurrent('Nested object to properties', () => {
    expect(converters2Layers.objectToProperties(nestedObject)).toEqual(properties)
  })

  test.concurrent('Properties to nested object', () => {
    expect(converters2Layers.objectToProperties(nestedObject)).toEqual(properties)
  })

  test.concurrent('Duplex: object -> properties -> object', () => {
    const toProps = converters2Layers.objectToProperties(nestedObject)
    const parsedBack = converters2Layers.propertiesToObject(toProps)

    expect(nestedObject).toEqual(parsedBack)
    expect(JSON.stringify(nestedObject)).toBe(JSON.stringify(parsedBack))
  })
})
